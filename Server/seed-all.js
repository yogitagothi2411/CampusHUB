const { fork } = require('child_process');
const path = require('path');

const seeds = [
  { name: 'club-service', script: path.join(__dirname, 'services', 'club-service', 'src', 'seed.js'), cwd: path.join(__dirname, 'services', 'club-service') },
  { name: 'event-service', script: path.join(__dirname, 'services', 'event-service', 'src', 'seed.js'), cwd: path.join(__dirname, 'services', 'event-service') }
];

async function runSeed(target) {
  return new Promise((resolve, reject) => {
    console.log(`[seed] Running seed for ${target.name}...`);
    const proc = fork(target.script, [], { cwd: target.cwd });
    proc.on('close', code => {
      if (code === 0) {
        console.log(`[seed] ${target.name} seeded successfully.`);
        resolve();
      } else {
        reject(new Error(`${target.name} seed exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    for (const target of seeds) {
      await runSeed(target);
    }
    console.log('[seed] All seed operations completed successfully.');
  } catch (err) {
    console.error('[seed] Error seeding databases:', err);
    process.exit(1);
  }
}

main();
