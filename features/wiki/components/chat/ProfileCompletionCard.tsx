import { FormEvent, useEffect, useState } from 'react';
import type { StudentProfile } from '@/lib/assistant-engine';

export type ProfileCompletionValues = {
  grade: string;
  goal: string;
  background: string;
  weeklyHours: number;
};

interface ProfileCompletionCardProps {
  profile: StudentProfile;
  disabled?: boolean;
  onSubmit: (values: ProfileCompletionValues) => void;
}

const GOAL_OPTIONS = [
  '保研 / 推免竞争力',
  '提高综测',
  '就业与实习',
  '能力提升',
];

export default function ProfileCompletionCard({
  profile,
  disabled = false,
  onSubmit,
}: ProfileCompletionCardProps) {
  const [grade, setGrade] = useState(profile.grade ?? '');
  const [goal, setGoal] = useState(profile.goal ?? '');
  const [background, setBackground] = useState(
    profile.foundation ?? profile.interest ?? '',
  );
  const [weeklyHours, setWeeklyHours] = useState(
    profile.weeklyHours ? String(profile.weeklyHours) : '',
  );

  useEffect(() => {
    setGrade(profile.grade ?? '');
    setGoal(profile.goal ?? '');
    setBackground(profile.foundation ?? profile.interest ?? '');
    setWeeklyHours(profile.weeklyHours ? String(profile.weeklyHours) : '');
  }, [profile]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedHours = Number(weeklyHours);
    if (
      !grade ||
      !goal ||
      !background.trim() ||
      !Number.isFinite(parsedHours) ||
      parsedHours <= 0
    ) {
      return;
    }
    onSubmit({
      grade,
      goal,
      background: background.trim(),
      weeklyHours: parsedHours,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_10px_35px_rgba(23,23,25,0.05)] sm:ml-11"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            补充你的情况
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[rgba(23,23,25,0.5)]">
            已识别的内容已经填好。补全后我会直接继续判断，不再重复确认。
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[rgba(26,109,79,0.1)] px-3 py-1 text-xs font-medium text-[#1a6d4f]">
          约 30 秒
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)]">
          年级
          <select
            required
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-3 text-base outline-none transition-colors focus:border-[var(--color-ink)]"
          >
            <option value="">请选择</option>
            <option value="大一">大一</option>
            <option value="大二">大二</option>
            <option value="大三">大三</option>
            <option value="大四">大四</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)]">
          当前目标
          <select
            required
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-3 text-base outline-none transition-colors focus:border-[var(--color-ink)]"
          >
            <option value="">请选择</option>
            {GOAL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)] sm:col-span-2">
          最有基础或最感兴趣的课程、项目
          <input
            required
            type="text"
            value={background}
            onChange={(event) => setBackground(event.target.value)}
            placeholder="例如：数据库课程，做过图书管理系统"
            className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-3 text-base outline-none transition-colors placeholder:text-[rgba(23,23,25,0.32)] focus:border-[var(--color-ink)]"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)] sm:col-span-2">
          每周可投入时间
          <span className="flex items-center gap-3">
            <input
              required
              type="number"
              min="1"
              max="80"
              step="0.5"
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(event.target.value)}
              placeholder="例如：10"
              className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] px-3 text-base outline-none transition-colors placeholder:text-[rgba(23,23,25,0.32)] focus:border-[var(--color-ink)]"
            />
            <span className="text-sm text-[rgba(23,23,25,0.5)]">小时 / 周</span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-crimson)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        按这些信息继续
      </button>
    </form>
  );
}
