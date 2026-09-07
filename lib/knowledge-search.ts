export type Corpus = 'policy' | 'resources';

export type KnowledgeChunk = {
  id: string;
  corpus: Corpus;
  title: string;
  category: string;
  source: string;
  content: string;
  resourceType?: string;
  stage?: string;
  url?: string;
};

export type SearchHit = KnowledgeChunk & { score: number };

const stopWords = new Set([
  '我现', '现在', '想要', '一个', '什么', '怎么', '哪些', '可以', '应该', '需要', '资料',
  '参加', '竞赛', '学生', '学校', '大学', '南京', '林业', '为了', '有什', '的资', '么资',
]);

const expansions: Record<string, string[]> = {
  '计网': ['计算机网络', '网络工程', 'Packet Tracer', '组网'],
  '网络': ['计算机网络', '网络工程', 'Packet Tracer', '组网'],
  '保研': ['推免', '综合成绩', '综测', '竞赛标准分'],
  '推免': ['保研', '综合成绩', '竞赛标准分'],
  '综测': ['学年综合素质测评', '发展素质分', '竞赛加分'],
  '算法': ['程序设计', '数据结构', '蓝桥杯', 'ICPC', 'CCPC', 'JSCPC'],
  '安全': ['信息安全', 'ISCC', 'CISC', 'CTF'],
  '建模': ['数学建模', '概率论', '统计', '国赛', '论文'],
  '图像分类': ['人工智能', '计算机视觉', '数字图像处理', '数据挖掘', '分类'],
  '目标检测': ['人工智能', '计算机视觉', '数字图像处理', '机器学习'],
  'pytorch': ['人工智能', '计算机视觉', '机器学习', '深度学习'],
  '机器学习': ['人工智能', '数据挖掘', '分类', '聚类'],
  '人工智能': ['计算机视觉', '数字图像处理', '数据挖掘', '计算机设计大赛', '机器人及人工智能'],
  '计算机视觉': ['人工智能', '数字图像处理', '图像分类', '数据挖掘'],
  '软件开发': ['软件工程', '软件设计', '软件测试', '项目文档'],
  '软件与产品开发': ['软件工程', '需求分析', '软件设计', '软件测试', '项目文档'],
  '物联网': ['嵌入式开发', '计算机组成原理', '项目报告'],
  '嵌入式与物联网': ['嵌入式开发', '单片机', '传感器', '项目报告'],
  '系统能力': ['操作系统', '计算机组成原理', '编译原理'],
  '系统与底层开发': ['系统能力', '操作系统', '计算机组成原理', '编译原理'],
  '数据库': ['数据库原理', 'SQL', '课程设计'],
  '数据库与数据管理': ['数据库原理', 'SQL', '数据库设计', '课程设计'],
};

function tokenizeWithoutExpansion(raw: string) {
  const text = raw.toLowerCase().normalize('NFKC');
  const words = text.match(/[a-z0-9][a-z0-9.+#-]*/g) ?? [];
  const runs = text.match(/[\u3400-\u9fff]+/g) ?? [];
  return [
    ...words,
    ...runs,
    ...runs.flatMap((run) =>
      Array.from({ length: Math.max(0, run.length - 1) }, (_, index) => run.slice(index, index + 2)),
    ),
  ];
}

export function tokenizeQuery(raw: string) {
  const text = raw.toLowerCase().normalize('NFKC');
  const words = text.match(/[a-z0-9][a-z0-9.+#-]*/g) ?? [];
  const chineseRuns = text.match(/[\u3400-\u9fff]+/g) ?? [];
  const chineseTokens: string[] = [];

  for (const run of chineseRuns) {
    if (run.length <= 5) chineseTokens.push(run);
    for (let index = 0; index < run.length - 1; index += 1) chineseTokens.push(run.slice(index, index + 2));
    for (let index = 0; index < run.length - 2; index += 2) chineseTokens.push(run.slice(index, index + 3));
  }

  const directExpansions = Object.entries(expansions)
    .filter(([key]) => text.includes(key))
    .flatMap(([, values]) => values.flatMap((value) => tokenizeWithoutExpansion(value)));

  return [...new Set([...words, ...chineseTokens, ...directExpansions])].filter(
    (token) => token.length > 1 && !stopWords.has(token),
  );
}

export function searchChunks(
  chunks: KnowledgeChunk[],
  query: string,
  corpus: Corpus,
  limit = 5,
): SearchHit[] {
  const tokens = tokenizeQuery(query);
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();

  return chunks
    .filter((chunk) => chunk.corpus === corpus)
    .map((chunk) => {
      const title = chunk.title.toLowerCase();
      const haystack = `${chunk.title}\n${chunk.category}\n${chunk.content}`.toLowerCase();
      let score = normalizedQuery.length > 4 && haystack.includes(normalizedQuery) ? 30 : 0;
      for (const token of tokens) {
        if (title.includes(token)) score += 7;
        const occurrences = haystack.split(token).length - 1;
        score += Math.min(occurrences, 5) * 1.35;
      }
      if (chunk.category && query.includes(chunk.category)) score += 8;
      return { ...chunk, score: Number(score.toFixed(2)) };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
