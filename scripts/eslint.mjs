import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { constants } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const nodeOptions = process.env.NODE_OPTIONS ?? '';
const hasHeapLimit = /--max[-_]old[-_]space[-_]size(?:[=\s]|$)/.test(nodeOptions);
// Match the Nix shell's heap budget when type-aware linting loads multiple workspaces.
const lintNodeOptions =
    process.env.ESLINT_RUN_EXPENSIVE_CHECKS === 'true' && !hasHeapLimit
        ? `${nodeOptions} --max-old-space-size=8192`.trim()
        : nodeOptions;

const result = spawnSync(
    process.execPath,
    [
        path.join(path.dirname(require.resolve('eslint/package.json')), 'bin/eslint.js'),
        '--cache',
        '--cache-strategy',
        'content',
        '--max-warnings',
        '0',
        ...process.argv.slice(2),
    ],
    {
        cwd: process.env.INIT_CWD ?? process.cwd(),
        env: { ...process.env, NODE_OPTIONS: lintNodeOptions },
        stdio: 'inherit',
    },
);

if (result.error) {
    console.error(result.error);
}
if (result.signal) {
    // Report the child failure without generating a second core dump in this launcher.
    process.exitCode = 128 + constants.signals[result.signal];
} else {
    process.exitCode = result.status ?? 1;
}
