import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyRequestIntent,
  completeProfileFromForm,
  missingRequiredFields,
  updateProfile,
} from '../lib/profile-parser.ts';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const cases = (
  await readFile(path.join(projectRoot, 'evals', 'badcases.jsonl'), 'utf8')
)
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function sameValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

const failures = [];

const regressionCases = cases.filter(
  (testCase) => testCase.status === 'fixed' && testCase.expected_profile,
);
const unresolvedCases = cases.filter((testCase) => testCase.status !== 'fixed');
const documentedFixedCases = cases.filter(
  (testCase) => testCase.status === 'fixed' && !testCase.expected_profile,
);

for (const testCase of regressionCases) {
  let profile = {};
  for (const turn of testCase.conversation)
    profile = updateProfile(profile, turn);

  for (const [field, expected] of Object.entries(testCase.expected_profile)) {
    if (!sameValue(profile[field], expected)) {
      failures.push(
        `${testCase.case_id}: ${field} expected ${JSON.stringify(expected)}, got ${JSON.stringify(profile[field])}`,
      );
    }
  }

  const missing = missingRequiredFields(profile);
  if (!sameValue(missing, testCase.expected_missing_required_fields)) {
    failures.push(
      `${testCase.case_id}: missing fields expected ${JSON.stringify(testCase.expected_missing_required_fields)}, got ${JSON.stringify(missing)}`,
    );
  }

  if (testCase.expected_first_reply_kind) {
    const firstReplyKind =
      classifyRequestIntent(testCase.conversation[0]) === 'lookup'
        ? 'lookup'
        : 'non_lookup';
    if (firstReplyKind !== testCase.expected_first_reply_kind) {
      failures.push(
        `${testCase.case_id}: first reply kind expected ${testCase.expected_first_reply_kind}, got ${firstReplyKind}`,
      );
    }
  }

  if (testCase.structured_form) {
    const formProfile = completeProfileFromForm({}, testCase.structured_form);
    const formMissing = missingRequiredFields(formProfile);
    if (formMissing.length > 0) {
      failures.push(
        `${testCase.case_id}: structured form still missing ${JSON.stringify(formMissing)}`,
      );
    }
  }
}

if (failures.length) {
  console.error(`Bad-case evaluation failed (${failures.length} assertions):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Bad-case evaluation passed: ${regressionCases.length} automated fixed cases; ${documentedFixedCases.length} documented fixed cases; ${unresolvedCases.length} unresolved cases tracked.`,
  );
}
