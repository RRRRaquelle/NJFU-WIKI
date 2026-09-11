type WindowBucket = {
  count: number;
  resetAt: number;
};

type DailyBucket = {
  day: string;
  count: number;
};

type GuardState = typeof globalThis & {
  __njfuMinuteBuckets?: Map<string, WindowBucket>;
  __njfuDailyBucket?: DailyBucket;
};

export type ModelQuota = {
  allowed: boolean;
  note?: string;
};

const state = globalThis as GuardState;
const minuteBuckets = state.__njfuMinuteBuckets ?? new Map<string, WindowBucket>();
state.__njfuMinuteBuckets = minuteBuckets;

function positiveInteger(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clientId(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'anonymous';
}

function currentDay() {
  return new Date().toISOString().slice(0, 10);
}

export function isAllowedRequestOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function reserveModelQuota(request: Request): ModelQuota {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };

  const now = Date.now();
  const perMinute = positiveInteger('LLM_RATE_LIMIT_PER_MINUTE', 6);
  const perDay = positiveInteger('LLM_DAILY_REQUEST_LIMIT', 80);
  const id = clientId(request);
  const previous = minuteBuckets.get(id);
  const bucket = !previous || previous.resetAt <= now
    ? { count: 0, resetAt: now + 60_000 }
    : previous;

  if (bucket.count >= perMinute) {
    return {
      allowed: false,
      note: '在线演示访问较频繁，本次已使用无需模型费用的规则检索结果。',
    };
  }

  const day = currentDay();
  const daily = state.__njfuDailyBucket?.day === day
    ? state.__njfuDailyBucket
    : { day, count: 0 };
  state.__njfuDailyBucket = daily;

  if (daily.count >= perDay) {
    return {
      allowed: false,
      note: '在线演示今日模型调用已达到保护上限，本次已使用规则检索结果。',
    };
  }

  bucket.count += 1;
  minuteBuckets.set(id, bucket);
  daily.count += 1;

  if (minuteBuckets.size > 1_000) {
    for (const [key, value] of minuteBuckets) {
      if (value.resetAt <= now) minuteBuckets.delete(key);
    }
  }

  return { allowed: true };
}
