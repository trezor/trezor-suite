import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const preload = `
    import childProcess from 'node:child_process';
    import { syncBuiltinESMExports } from 'node:module';
    childProcess.spawnSync = (command, args, options) => {
        console.log(JSON.stringify({ command, args, cwd: options.cwd, nodeOptions: options.env.NODE_OPTIONS }));
        return { status: Number(process.env.MOCK_EXIT_CODE ?? 0), signal: process.env.MOCK_SIGNAL };
    };
    syncBuiltinESMExports();
`;

for (const [expensive, nodeOptions, expected] of [
    ['true', '', '--max-old-space-size=8192'],
    ['true', '--trace-warnings', '--trace-warnings --max-old-space-size=8192'],
    ['true', '--max_old_space_size=6144', '--max_old_space_size=6144'],
    ['true', '--max-old-space-size=6144', '--max-old-space-size=6144'],
    ['false', '', ''],
]) {
    test(`lint heap options: expensive=${expensive}, options=${nodeOptions}`, () => {
        const result = spawnSync(
            process.execPath,
            [
                `--import=data:text/javascript,${encodeURIComponent(preload)}`,
                path.join(directory, 'eslint.mjs'),
                '--fix',
                'file with spaces.ts',
            ],
            {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    INIT_CWD: directory,
                    ESLINT_RUN_EXPENSIVE_CHECKS: expensive,
                    NODE_OPTIONS: nodeOptions,
                },
            },
        );
        assert.equal(result.status, 0, result.stderr);
        const output = JSON.parse(result.stdout);
        assert.equal(output.nodeOptions, expected);
        assert.equal(output.cwd, directory);
        assert.deepEqual(output.args.slice(1), [
            '--cache',
            '--cache-strategy',
            'content',
            '--max-warnings',
            '0',
            '--fix',
            'file with spaces.ts',
        ]);
    });
}

for (const [code, signal, expected] of [
    ['2', '', 2],
    ['0', 'SIGABRT', 134],
] as const) {
    test(`lint failure is preserved: ${signal || code}`, () => {
        const result = spawnSync(
            process.execPath,
            [
                `--import=data:text/javascript,${encodeURIComponent(preload)}`,
                path.join(directory, 'eslint.mjs'),
            ],
            {
                encoding: 'utf8',
                env: { ...process.env, MOCK_EXIT_CODE: code, MOCK_SIGNAL: signal },
            },
        );
        assert.equal(result.signal, null);
        assert.equal(result.status, expected, result.stderr);
    });
}
