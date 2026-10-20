/**
 * Standalone Unified E2E Test Suite Runner
 * Runs all Tiers 1 through 4 using Node.js native test runner
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const testFiles = [
  'tests/tier1-pipeline-hygiene.test.mjs',
  'tests/tier2-domain-invariants.test.mjs',
  'tests/tier3-dom-transitions.test.mjs',
  'tests/tier4-customer-journeys.test.mjs'
];

console.log('='.repeat(70));
console.log('  SABE A PERU — E2E TEST SUITE RUNNER (TIERS 1 TO 4)');
console.log('='.repeat(70));
console.log(`Running ${testFiles.length} test tiers with Node.js ${process.version} native runner...\n`);

const startTime = Date.now();

const child = spawn(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(70));
  if (code === 0) {
    console.log(`  RESULT: ALL TEST SUITES PASSED (Duration: ${duration}s)`);
    console.log('  Tier 1: Pipeline & Hygiene           [PASS]');
    console.log('  Tier 2: Boundary & Domain Invariants [PASS]');
    console.log('  Tier 3: DOM Transitions & Pairwise   [PASS]');
    console.log('  Tier 4: Real-World Scenarios         [PASS]');
  } else {
    console.error(`  RESULT: TEST SUITE FAILED (Exit Code: ${code}, Duration: ${duration}s)`);
  }
  console.log('='.repeat(70));
  process.exit(code);
});
