#!/usr/bin/env node
// =============================================================
//  XLB Blog -- Build & Start
//  Usage: node build.js [--prod] [--skip-seed] [--port PORT]
//  Compatible: macOS / Linux / Windows (any terminal)
// =============================================================

const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

// ── parse args ───────────────────────────────────────────────
const args = process.argv.slice(2);
let prod         = false;
let skipSeed     = false;
let portOverride = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--prod')       prod = true;
  else if (args[i] === '--skip-seed') skipSeed = true;
  else if (args[i] === '--port')  portOverride = args[++i];
}

// ── colors ───────────────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const c = {
  red:     isTTY ? '\x1b[31m' : '',
  green:   isTTY ? '\x1b[32m' : '',
  yellow:  isTTY ? '\x1b[33m' : '',
  cyan:    isTTY ? '\x1b[36m' : '',
  magenta: isTTY ? '\x1b[35m' : '',
  gray:    isTTY ? '\x1b[90m' : '',
  bold:    isTTY ? '\x1b[1m'  : '',
  reset:   isTTY ? '\x1b[0m'  : '',
};

const step = (msg) => console.log(`\n${c.cyan}>> ${msg}${c.reset}`);
const ok   = (msg) => console.log(`  ${c.green}[OK]${c.reset}  ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}[WARN]${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.gray}      ${msg}${c.reset}`);
const fail = (msg) => { console.log(`  ${c.red}[FAIL]${c.reset} ${msg}`); process.exit(1); };

const run  = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

// ── resolve project root ──────────────────────────────────────
const ROOT = path.resolve(__dirname);
process.chdir(ROOT);

// ── banner ───────────────────────────────────────────────────
console.log(`\n${c.magenta}${c.bold}  ==========================================`);
console.log(`    XLB Blog  |  Build and Start`);
console.log(`  ==========================================${c.reset}\n`);

// ── 1. check Node.js version ─────────────────────────────────
step('Checking environment');

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) fail(`Node.js v${process.versions.node} is too old. Requires >= 18`);
ok(`Node.js ${process.version}`);

try {
  const npmVer = execSync('npm -v', { encoding: 'utf8' }).trim();
  ok(`npm ${npmVer}`);
} catch {
  fail('npm not found');
}

// ── 2. install dependencies ───────────────────────────────────
step('Installing dependencies');

if (prod) {
  info('Production mode -- npm ci --omit=dev');
  run('npm ci --omit=dev');
} else {
  info('Development mode -- npm install');
  run('npm install');
}
ok('Dependencies ready');

// ── 3. setup .env ────────────────────────────────────────────
step('Configuring environment');

const envPath     = path.join(ROOT, '.env');
const envExample  = path.join(ROOT, '.env.example');

if (!fs.existsSync(envPath)) {
  if (!fs.existsSync(envExample)) fail('.env.example not found');
  fs.copyFileSync(envExample, envPath);
  ok('.env created from .env.example');
  warn('Consider updating SESSION_SECRET in .env for production');
} else {
  ok('.env already exists -- skipping');
}

// override port if supplied
if (portOverride) {
  let content = fs.readFileSync(envPath, 'utf8');
  if (/^PORT=/m.test(content)) {
    content = content.replace(/^PORT=.*/m, `PORT=${portOverride}`);
  } else {
    content += `\nPORT=${portOverride}`;
  }
  fs.writeFileSync(envPath, content);
  ok(`Port set to ${portOverride}`);
}

// ── 4. create required directories ───────────────────────────
step('Preparing directories');

for (const dir of ['data', 'uploads']) {
  const fullPath = path.join(ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    ok(`Created: ${dir}/`);
  } else {
    ok(`Exists:  ${dir}/`);
  }
}

// ── 5. init database ─────────────────────────────────────────
step('Initializing database');

// read DB_PATH from .env
const envContent = fs.readFileSync(envPath, 'utf8');
const dbPathMatch = envContent.match(/^DB_PATH=(.+)/m);
const dbPath = (dbPathMatch ? dbPathMatch[1].trim() : 'data/blog.db');
const dbFull = path.join(ROOT, dbPath);

if (skipSeed) {
  warn('Skipping database seed (--skip-seed)');
} else if (fs.existsSync(dbFull)) {
  ok(`Database exists: ${dbPath} -- skipping seed`);
  info(`Delete ${dbPath} and re-run to reset data`);
} else {
  info('Running seed script...');
  run('node server/db/seed.js');
  ok(`Database initialized: ${dbPath}`);
}

// ── 6. build summary ─────────────────────────────────────────
step('Build summary');

const portMatch = envContent.match(/^PORT=(.+)/m);
const actualPort = portOverride || (portMatch ? portMatch[1].trim() : '3000');
const mode = prod ? 'production' : 'development';

info(`Mode     : ${mode}`);
info(`Port     : ${actualPort}`);
info(`Database : ${dbPath}`);
info(`URL      : http://localhost:${actualPort}`);
if (!prod) info(`Admin    : http://localhost:${actualPort}/admin  (admin / admin123)`);

// ── 7. start server ──────────────────────────────────────────
console.log(`\n${c.magenta}${c.bold}  ==========================================`);
console.log(`  Starting server ... Press Ctrl+C to stop`);
console.log(`  ==========================================${c.reset}\n`);

// decide command: nodemon (dev) or node (prod / fallback)
let cmd, cmdArgs;
if (prod) {
  cmd = 'node';
  cmdArgs = ['server/index.js'];
} else {
  // check nodemon availability
  try {
    execSync('nodemon --version', { stdio: 'ignore' });
    info('Using nodemon (hot-reload)');
    cmd = 'nodemon';
    cmdArgs = ['server/index.js'];
  } catch {
    warn('nodemon not found -- using node (no hot-reload)');
    cmd = 'node';
    cmdArgs = ['server/index.js'];
  }
}

const env = { ...process.env };
if (prod) env.NODE_ENV = 'production';

const child = spawn(cmd, cmdArgs, {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32', // needed for Windows cmd resolution
});

child.on('exit', (code) => process.exit(code ?? 0));

// forward Ctrl+C to child
process.on('SIGINT',  () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
