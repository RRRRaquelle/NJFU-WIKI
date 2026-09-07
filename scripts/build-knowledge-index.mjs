import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const competitionMarkdown = path.join(
  workspaceRoot,
  '竞赛',
  '南京林业大学计算机类竞赛选择与行动指南-RAG导入版.md',
);
const competitionCsvDir = path.join(workspaceRoot, '竞赛', '竞赛知识库-CSV表格');
const resourcesDir = path.join(
  workspaceRoot,
  '资料目录',
  'NJFU-Courses-RAG',
  'Dify导入-分课程',
);
const outputPath = path.join(projectRoot, 'app', 'data', 'knowledge.json');

function normalize(value) {
  return value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function valueAfter(block, label) {
  const match = block.match(new RegExp(`^${label}：(.+)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field.trim());
      field = '';
    } else if (character === '\n') {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function parsePolicyMarkdown(text) {
  const lines = text.split('\n');
  const chunks = [];
  let section = '';
  let subsection = '';
  let buffer = [];

  const flush = () => {
    const body = normalize(buffer.join('\n'));
    if (!body || !subsection) return;
    chunks.push({
      id: `policy-md-${String(chunks.length + 1).padStart(3, '0')}`,
      corpus: 'policy',
      title: subsection,
      category: section,
      source: '竞赛选择与行动指南',
      content: normalize(`${section}\n${subsection}\n${body}`),
    });
  };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flush();
      buffer = [];
      subsection = '';
      section = line.replace(/^##\s+/, '').trim();
    } else if (/^###\s+/.test(line)) {
      flush();
      buffer = [];
      subsection = line.replace(/^###\s+/, '').trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

function parseResourceMarkdown(text, fileName) {
  return text
    .split(/(?=^###\s+资料记录\s+)/m)
    .slice(1)
    .map((raw, index) => {
      const block = normalize(raw);
      const id = block.match(/^###\s+资料记录\s+([^\n]+)/)?.[1]?.trim() || `${fileName}-${index}`;
      const title = valueAfter(block, '资源名称');
      const url = block.match(/GitHub访问链接：\[[^\]]+\]\((https:\/\/[^)]+)\)/)?.[1] ?? '';
      return {
        id,
        corpus: 'resources',
        title,
        category: valueAfter(block, '所属课程'),
        source: 'NJFU-CS/NJFU-Courses',
        resourceType: valueAfter(block, '资料类型'),
        stage: valueAfter(block, '推荐使用阶段'),
        url,
        content: block.replace(/^###\s+资料记录\s+[^\n]+\n?/, ''),
      };
    });
}

const policyText = await readFile(competitionMarkdown, 'utf8');
const policyChunks = parsePolicyMarkdown(policyText);

const csvFiles = (await readdir(competitionCsvDir)).filter((name) => name.endsWith('.csv')).sort();
for (const fileName of csvFiles) {
  const csvText = await readFile(path.join(competitionCsvDir, fileName), 'utf8');
  const [headers, ...rows] = parseCsv(csvText);
  if (!headers) continue;
  rows.forEach((row, index) => {
    const pairs = headers.map((header, column) => `${header}：${row[column] ?? ''}`);
    policyChunks.push({
      id: `policy-csv-${fileName.replace(/\.csv$/, '')}-${String(index + 1).padStart(3, '0')}`,
      corpus: 'policy',
      title: row[0] || fileName.replace(/\.csv$/, ''),
      category: fileName.replace(/^\d+_/, '').replace(/\.csv$/, ''),
      source: fileName,
      content: normalize(pairs.join('\n')),
    });
  });
}

const resourceFiles = (await readdir(resourcesDir)).filter((name) => name.endsWith('.md')).sort();
const resourceChunks = [];
for (const fileName of resourceFiles) {
  const text = await readFile(path.join(resourcesDir, fileName), 'utf8');
  resourceChunks.push(...parseResourceMarkdown(text, fileName));
}

const payload = {
  generatedAt: new Date().toISOString(),
  stats: {
    policyChunks: policyChunks.length,
    resourceChunks: resourceChunks.length,
  },
  chunks: [...policyChunks, ...resourceChunks],
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${payload.chunks.length} chunks to ${outputPath}`);
