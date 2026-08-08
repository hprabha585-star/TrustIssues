const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');
const publicDir = path.join(serverDir, 'public');
const distDir = path.join(clientDir, 'dist');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function ensureBuildOutput() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Client build output not found at ${distDir}`);
  }
}

console.log('Installing client dependencies...');
run('npm', ['install'], clientDir);

console.log('Building client...');
run('npm', ['run', 'build'], clientDir);

ensureBuildOutput();

console.log('Copying UI build into server/public...');
fs.rmSync(publicDir, { recursive: true, force: true });
fs.cpSync(distDir, publicDir, { recursive: true });

console.log('Installing server dependencies...');
run('npm', ['install', '--omit=dev'], serverDir);

console.log('Build complete. Run "node server/app.js" or "npm start" from the repo root to start the app.');
