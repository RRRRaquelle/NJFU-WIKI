export type StudentProfile = {
  grade?: string;
  goal?: string;
  foundation?: string;
  interest?: string;
  weeklyHours?: number;
  weeklyHoursRange?: [number, number];
  weeklyHoursLabel?: string;
  team?: string;
  algorithmWeak?: boolean;
};

export type ProfileCompletionInput = {
  grade: string;
  goal: string;
  background: string;
  weeklyHours: number;
};

export function classifyRequestIntent(input: string): 'lookup' | 'decision' {
  const asksForPersonalDecision =
    /(推荐|适合我|我适合|适合参加|应该(?:参加|选择|验证|先)|该参加|先看|先补|第一步|怎么开始|从哪里开始|哪个比赛开始|想参加.+比赛|是转.+还是|继续做.+方向)/.test(
      input,
    );
  const asksForFacts =
    /(哪些|多少|几分|要求|规则|政策|资料|真题|课件|教材|模板|报告|什么时候|何时|报名|赛程|准备什么|由什么组成|怎么折算|有什么区别|能靠.+吗|是不是|是否|适合什么|适合作为|需要哪些能力)/.test(
      input,
    );
  return asksForFacts && !asksForPersonalDecision ? 'lookup' : 'decision';
}

const gradeMap: Record<string, string> = {
  一: '大一',
  '1': '大一',
  二: '大二',
  '2': '大二',
  三: '大三',
  '3': '大三',
  四: '大四',
  '4': '大四',
};

const chineseDigitMap: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
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
  const numberPattern = '(?:\\d+(?:\\.\\d+)?|[零〇一二两三四五六七八九十]+)';
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
  if (first === undefined || second === undefined || first <= 0 || second <= 0)
    return undefined;

  const sourceMin = Math.min(first, second);
  const sourceMax = Math.max(first, second);
  const nearbyPrefix = text.slice(Math.max(0, match.index - 14), match.index);
  const isDaily = /(?:每天|每日|一天)/.test(nearbyPrefix);
  const isWeekly = /(?:每周|每星期|一周)/.test(nearbyPrefix);
  const multiplier = isDaily ? 7 : 1;
  const weeklyMin = sourceMin * multiplier;
  const weeklyMax = sourceMax * multiplier;
  const weeklyHours = (weeklyMin + weeklyMax) / 2;
  const weeklyDisplay =
    weeklyMin === weeklyMax ? `${weeklyMin}` : `${weeklyMin}–${weeklyMax}`;
  const sourceDisplay =
    sourceMin === sourceMax ? `${sourceMin}` : `${sourceMin}–${sourceMax}`;

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

function inferDirection(text: string) {
  const routes: Array<[RegExp, string]> = [
    [/网络|计网|packet\s*tracer|组网|思科/i, '计算机网络'],
    [/安全|ctf|iscc|渗透|密码/i, '信息安全'],
    [/算法|蓝桥|acm|icpc|ccpc|数据结构/i, '算法与程序设计'],
    [/数学|建模|统计|数据分析/i, '数学建模'],
    [
      /人工智能|\bai\b|深度学习|机器学习|图像分类|计算机视觉|目标检测|神经网络|pytorch|tensorflow/i,
      '人工智能 / 计算机视觉',
    ],
    [/数据库|\bsql\b|mysql|数据管理/i, '数据库与数据管理'],
    [/操作系统|底层开发|内核|编译原理|系统能力/i, '系统与底层开发'],
    [/嵌入式|物联网|单片机|传感器/i, '嵌入式与物联网'],
    [/网站|app|前端|后端|软件|小程序/i, '软件与产品开发'],
  ];
  return routes.find(([pattern]) => pattern.test(text))?.[1];
}

function inferFoundation(text: string, current?: string) {
  const direction = inferDirection(text);
  if (!direction) return current;
  const hasEvidence =
    /(?:学过|会(?:一点|一些)?|做过|完成过|参加过|练过|有.{0,8}基础|项目.{0,8}(?:完整|经验)|(?:课程|项目).{0,16}(?:搭建|设计|开发|系统|实践|作业)|(?:课|课程).{0,8}(?:还可以|不错)|(?:数学|建模|概率|统计).{0,8}(?:还可以|不错|尚可)|做过.{0,12}题)/.test(
      text,
    );
  if (!hasEvidence) return current;
  if (
    /概率统计.{0,8}(?:还可以|不错|尚可)/.test(text) &&
    !/(?:数学建模课|做过.{0,8}建模|参加过.{0,8}建模)/.test(text)
  ) {
    return '数学与统计';
  }
  return direction;
}

export function completeProfileFromForm(
  current: StudentProfile,
  input: ProfileCompletionInput,
): StudentProfile {
  const weeklyHours = Math.max(0.5, Math.min(80, input.weeklyHours));
  const background = input.background.trim();
  return {
    ...current,
    grade: input.grade,
    goal: input.goal,
    foundation: inferDirection(background) ?? background,
    weeklyHours,
    weeklyHoursRange: [weeklyHours, weeklyHours],
    weeklyHoursLabel: `每周约 ${weeklyHours} 小时`,
  };
}

function inferInterest(text: string, current?: string) {
  const direction = inferDirection(text);
  if (!direction) return current;
  return /(?:喜欢|感兴趣|想学|想练)/.test(text) ? direction : current;
}

function parseTeam(text: string, current?: string) {
  if (/没有队友|一个人|单人|独自/.test(text)) return '暂时单人';
  const numberPattern = '([零〇一二两三四五六七八九十\\d]+)';
  const teammateMatch = text.match(
    new RegExp(
      `${numberPattern}\\s*(?:个|名|位)?(?:[\\u3400-\\u9fff]{0,8})?(?:同学|队友|伙伴)`,
    ),
  );
  const groupMatch = text.match(
    new RegExp(
      `${numberPattern}\\s*(?:个|名|位)?\\s*人(?:组队|团队|队伍|小组|组)?`,
    ),
  );
  const teamMatch = teammateMatch ?? groupMatch;
  if (!teamMatch) return current;
  const count = parseNaturalNumber(teamMatch[1]);
  return count ? `${count}名可协作同学` : current;
}

export function updateProfile(
  current: StudentProfile,
  text: string,
): StudentProfile {
  const gradeMatch = text.match(/(?:大([一二三四1-4])|([一二三四1-4])年级)/);
  const gradeToken = gradeMatch?.[1] ?? gradeMatch?.[2];
  const timeBudget = parseTimeBudget(text);

  let goal = current.goal;
  if (/保研|推免/.test(text)) goal = '保研 / 推免竞争力';
  else if (/综测|素质拓展|加分/.test(text)) goal = '提高综测';
  else if (/就业|实习|求职/.test(text)) goal = '就业与实习';
  else if (/学会|能力|入门|提升|学东西|打基础/.test(text)) goal = '能力提升';

  return {
    ...current,
    grade: gradeToken ? gradeMap[gradeToken] : current.grade,
    goal,
    foundation: inferFoundation(text, current.foundation),
    interest: inferInterest(text, current.interest),
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
  if (!profile.foundation && !profile.interest)
    missing.push('最有基础或最感兴趣的课程、项目');
  if (!profile.weeklyHours) missing.push('每周可投入时间');
  return missing;
}
