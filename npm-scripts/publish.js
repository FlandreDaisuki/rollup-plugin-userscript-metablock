import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const packageJson = fs.readFileSync(path.resolve(import.meta.dirname, '../package.json'), 'utf8');
const pkg = JSON.parse(packageJson);
spawnSync('git', ['tag', `v${pkg.version}`]);
