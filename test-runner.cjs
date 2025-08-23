const { execSync } = require('child_process');

const commands = [
  { cmd: 'node cli.js --help', desc: 'Display general help' },
  { cmd: 'node cli.js listversions', desc: 'List package manager versions' },
  { cmd: 'node cli.js agent --help', desc: 'Display agent help' },
  { cmd: 'node cli.js host --help', desc: 'Display host help' },
  { cmd: 'node cli.js bundle --help', desc: 'Display bundler help' },
  { cmd: 'node cli.js create --help', desc: 'Display create help' },
  { cmd: 'node cli.js manage', desc: 'Test manage command (expect fail with help)', shouldFail: true },
];

let failed = 0;
let passed = 0;

console.log('Running Betterpack command tests...');

commands.forEach(test => {
  console.log(`\n--- Testing: ${test.desc} ---`);
  console.log(`$ ${test.cmd}`);
  try {
    const output = execSync(test.cmd, { encoding: 'utf8' });
    console.log(output.trim());
    if (test.shouldFail) {
      console.error('❌ TEST FAILED: Command was expected to fail but succeeded.');
      failed++;
    } else {
      console.log('✅ TEST PASSED');
      passed++;
    }
  } catch (error) {
    console.error(error.stdout.trim());
    if (test.shouldFail) {
      console.log('✅ TEST PASSED: Command failed as expected.');
      passed++;
    } else {
      console.error(`❌ TEST FAILED: Command failed unexpectedly.`);
      console.error(`Exit Code: ${error.status}`);
      failed++;
    }
  }
});

console.log('\n--- Test Summary ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('--------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed successfully! 🎉');
  process.exit(0);
}
