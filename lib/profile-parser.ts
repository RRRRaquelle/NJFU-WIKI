export type StudentProfile = {
  grade?: string;
  goal?: string;
  foundation?: string;
  weeklyHours?: number;
  weeklyHoursRange?: [number, number];
  weeklyHoursLabel?: string;
  team?: string;
  algorithmWeak?: boolean;
};

const gradeMap: Record<string, string> = {
  '一': '大一', '1': '大一',
  '二': '大二', '2': '大二',
  '三': '大三', '3': '大三',
  '四': '大四', '4': '大四',
};

const chineseDigitMap: Record<string, number> = {
  '零': 0, '〇': 0,
  '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9,
};

export function parseNaturalNumber(raw: string): number | undefined {
  const value = raw.trim();
  if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (value === '十') return 10;
  if (value.includes('十')) {
    const [tens, units] = value.split('十');
    const tensValue = tens ? chineseDigitMap[tens] : 1;
    const unitsValue = units ? chineseDigitMap[units] : 0;
    if (tensValue === undefined || unitsValue === undefined) return undefined;
    return tensValue * 10 + unitsValue;
  }
  return chineseDigitMap[value];
}

type ParsedTime = {
  weeklyHours: number;
  weeklyHoursRange: [number, number];
  weeklyHoursLabel: string;
};

function parseTimeBudget(text: string): ParsedTime | undefined {
  const numberPattern = '[零〇一二两三四五六七八九十\\d]+';
  const rangePattern = new RegExp(
    `(${numberPattern})\\s*(?:到|至|[-~～—])\\s*(${numberPattern})\\s*(?:个)?\\s*(?:小时|h(?:ours?)?)`,
    'i',
  );
  const singlePattern = new RegExp(
    `(${numberPattern})\\s*(?:个)?\\s*(?:小时|h(?:ours?)?)`,
    'i',
  );
  const rangeMatch = rangePattern.exec(text);
  const match = rangeMatch ?? singlePattern.exec(text);
  if (!match || match.index === undefined) return undefined;

  const first = parseNaturalNumber(match[1]);
  const second = rangeMatch ? parseNaturalNumber(match[2]) : first;
  if (first === undefined || second === undefined || first <= 0 || second <= 0) return undefined;

  const sourceMin = Math.min(first, second);
  const sourceMax = Math.max(first, second);
  const nearbyPrefix = text.slice(Math.max(0, match.index - 14), match.index);
  const isDaily = /(?:每天|每日|一天)/.test(nearbyPrefix);
  const isWeekly = /(?:每周|每星期|一周)/.test(nearbyPrefix);
  const multiplier = isDaily ? 7 : 1;
  const weeklyMin = sourceMin * multiplier;
  const weeklyMax = sourceMax * multiplier;
  const weeklyHours = (weeklyMin + weeklyMax) / 2;
  const weeklyDisplay = weeklyMin === weeklyMax ? `${weeklyMin}` : `${weeklyMin}–${weeklyMax}`;
  const sourceDisplay = sourceMin === sourceMax ? `${sourceMin}` : `${sourceMin}–${sourceMax}`;

  return {
    weeklyHours,
    weeklyHoursRange: [weeklyMin, weeklyMax],
    weeklyHoursLabel: isDaily
      ? `每周约 ${weeklyDisplay} 小时（每天 ${sourceDisplay} 小时）`
      : isWeekly
        ? `每周约 ${weeklyDisplay} 小时`
        : `约 ${weeklyDisplay} 小时（周期未说明）`,
  };
}

function inferFoundation(text: string, current?: string) {
  const routes: Array<[RegExp, string]> = [
    [/网络|计网|packet\s*tracer|组网|思科/i, '计算机网络'],
    [/安全|ctf|iscc|渗透|密码/i, '信息安全'],
    [/算法|蓝桥|acm|icpc|ccpc|数据结构/i, '算法与程序设计'],
    [/数学|建模|统计|数据分析/i, '数学建模'],
    [/人工智能|\bai\b|深度学习|机器学习|图像分类|计算机视觉|目标检测|神经网络|pytorch|tensorflow/i, '人工智能 / 计算机视觉'],
    [/网站|app|前端|后端|软件|小程序/i, '软件与产品开发'],
  ];
  return routes.find(([pattern]) => pattern.test(text))?.[1] ?? current;
}

function parseTeam(text: string, current?: string) {
  if (/没有队友|一个人|单人|独自/.test(text)) return '暂时单人';
  const teamMatch = text.match(/([零〇一二两三四五六七八九十\d]+)\s*(?:个|名)?(?:[\u3400-\u9fff]{0,8})?(?:同学|队友|伙伴)/);
  if (!teamMatch) return current;
  const count = parseNaturalNumber(teamMatch[1]);
  return count ? `${count}名可协作同学` : current;
}

export function updateProfile(current: StudentProfile, text: string): StudentProfile {
  const gradeMatch = text.match(/(?:大([一二三四1-4])|([一二三四1-4])年级)/);
  const gradeToken = gradeMatch?.[1] ?? gradeMatch?.[2];
  const timeBudget = parseTimeBudget(text);

  let goal = current.goal;
  if (/保研|推免/.test(text)) goal = '保研 / 推免竞争力';
  else if (/综测|素质拓展|加分/.test(text)) goal = '提高综测';
  else if (/就业|实习|求职/.test(text)) goal = '就业与实习';
  else if (/学会|能力|入门|提升/.test(text)) goal = '能力提升';

  return {
    ...current,
    grade: gradeToken ? gradeMap[gradeToken] : current.grade,
    goal,
    foundation: inferFoundation(text, current.foundation),
    weeklyHours: timeBudget?.weeklyHours ?? current.weeklyHours,
    weeklyHoursRange: timeBudget?.weeklyHoursRange ?? current.weeklyHoursRange,
    weeklyHoursLabel: timeBudget?.weeklyHoursLabel ?? current.weeklyHoursLabel,
    team: parseTeam(text, current.team),
    algorithmWeak: /算法.{0,6}(弱|不好|一般|不行)|不擅长.{0,4}算法/.test(text)
      ? true
      : current.algorithmWeak,
  };
}

export function missingRequiredFields(profile: StudentProfile) {
  const missing: string[] = [];
  if (!profile.grade) missing.push('年级');
  if (!profile.goal) missing.push('目标');
  if (!profile.foundation) missing.push('最有基础的课程或项目');
  if (!profile.weeklyHours) missing.push('每周可投入时间');
  return missing;
}
