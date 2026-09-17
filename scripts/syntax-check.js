import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const includeDirs = ['.', 'demo-commercial', 'lib', 'scripts', 'services', 'tests'];
const skipDirs = new Set(['.git', 'node_modules', '.vercel', '.data']);
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) files.push(path.join(dir, entry.name));
  }
}

for (const dir of includeDirs) {
  const target = path.join(root, dir);
  if (dir === '.') {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.js')) files.push(path.join(target, entry.name));
    }
  } else {
    walk(target);
  }
}

let failed = false;
for (const file of [...new Set(files)].sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`Syntax check passed for ${new Set(files).size} JavaScript files.`);
