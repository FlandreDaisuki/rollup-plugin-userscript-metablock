const { version } = require('../package.json');
const { spawnSync } = require('child_process');

const tagver = `v${version}`;

spawnSync('git', ['stash']);
spawnSync('git', ['tag', tagver]);
spawnSync('git', ['checkout', 'master']);
spawnSync('git', ['merge', tagver]);
spawnSync('git', ['push', tagver]);
spawnSync('git', ['checkout', tagver]);
spawnSync('git', ['stash', 'pop']);

