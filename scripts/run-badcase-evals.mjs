import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { missingRequiredFields, updateProfile } from '../lib/profile-parser.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = JSON.parse(await readFile(path.join(projectRoot, 'evals', 'badcases.json'), 'utf8'));

function sameValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

const failures = [];

for (const testCase of suite.cases) {
  let profile = {};
  for (const turn of testCase.conversation) profile = updateProfile(profile, turn);

  for (const [field, expected] of Object.entries(testCase.expectedProfile)) {
    if (!sameValue(profile[field], expected)) {
      failures.push(`${testCase.id}: ${field} expected ${JSON.stringify(expected)}, got ${JSON.stringify(profile[field])}`);
    }
  }

  const missing = missingRequiredFields(profile);
  if (!sameValue(missing, testCase.expectedMissingRequiredFields)) {
    failures.push(`${testCase.id}: missing fields expected ${JSON.stringify(testCase.expectedMissingRequiredFields)}, got ${JSON.stringify(missing)}`);
  }
}

if (failures.length) {
  console.error(`Bad-case evaluation failed (${failures.length} assertions):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Bad-case evaluation passed: ${suite.cases.length} cases.`);
}
