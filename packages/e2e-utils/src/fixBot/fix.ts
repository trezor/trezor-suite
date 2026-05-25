import { execFileSync, spawnSync } from 'node:child_process';
import {
    closeSync,
    cpSync,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync,
    readdirSync,
    symlinkSync,
    unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { error, log } from '../logger';
import { publishPR } from './publish';
import { logAgentResult, reportTokenUsage } from './reportTokenUsage';
import { type FixTask, ReportSchema } from './schemas';

const AUTOMATABLE = new Set<FixTask['fix_scope']>(['TEST_CODE', 'LOCATOR_ADD']);

function isAutomatable(task: FixTask): boolean {
    return AUTOMATABLE.has(task.fix_scope) && task.validations.length > 0;
}

function latestReport(reportDir: string): string {
    const files = readdirSync(reportDir)
        .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort();
    if (!files.length) throw new Error(`No report files in ${reportDir}`);

    return join(reportDir, files[files.length - 1]);
}

function setupWorktree(root: string, task: FixTask, worktreePath: string): void {
    if (existsSync(worktreePath)) {
        execFileSync('git', ['worktree', 'remove', worktreePath, '--force']);
    }
    try {
        execFileSync('git', ['branch', '-D', '--', task.branch]);
    } catch {
        // branch doesn't exist yet on first run
    }

    execFileSync('git', ['worktree', 'add', worktreePath, '-b', task.branch, 'origin/develop']);
    symlinkSync(join(root, 'node_modules'), join(worktreePath, 'node_modules'));

    execFileSync('git', [
        '-C',
        worktreePath,
        'submodule',
        'update',
        '--init',
        'submodules/trezor-common',
    ]);
    // use default git hooks instead of personal custom ones
    execFileSync('git', [
        '-C',
        worktreePath,
        'config',
        'core.hooksPath',
        join(worktreePath, '.husky'),
    ]);

    const envFile = join(root, 'suite/e2e/.env');
    if (existsSync(envFile)) {
        cpSync(envFile, join(worktreePath, 'suite/e2e/.env'));
    }

    for (const dir of ['packages/suite-desktop/dist', 'packages/suite-desktop/build'] as const) {
        const src = join(root, dir);
        if (existsSync(src)) {
            mkdirSync(join(worktreePath, dirname(dir)), { recursive: true });
            symlinkSync(src, join(worktreePath, dir));
        }
    }
}

function runAgent(
    root: string,
    fixAgentDir: string,
    reportDir: string,
    task: FixTask,
    worktreePath: string,
): void {
    const prompt = `${readFileSync(join(fixAgentDir, 'FIX_AGENT.md'), 'utf-8')}\n\n---\n\n## Fix Task\n\n\`\`\`json\n${JSON.stringify(task, null, 2)}\n\`\`\`\n`;

    // Write stdout to a temp file to avoid spawnSync's in-memory buffer limit (ENOBUFS).
    const tmpFile = join(tmpdir(), `claude-fix-${task.id}-${Date.now()}.json`);
    const stdoutFd = openSync(tmpFile, 'w');

    const env = { ...process.env };
    // Prevents an internal Claude Code setting from accidentally being inherited by the subprocess and breaking it
    delete env['MCP_CONNECTION_NONBLOCKING'];

    const result = spawnSync(
        join(root, 'node_modules/.bin/claude'),
        [
            '--print',
            '--verbose',
            '--output-format',
            'json',
            '--settings',
            join(fixAgentDir, 'settings.json'),
        ],
        { input: prompt, cwd: worktreePath, env, stdio: ['pipe', stdoutFd, 'inherit'] },
    );

    closeSync(stdoutFd);

    const output = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    reportTokenUsage(output, join(reportDir, 'token_usage.txt'), `fix:${task.id}`);
    logAgentResult(output, `fix:${task.id}`);

    if (result.error) throw result.error;
    if (result.status !== 0 || result.signal) {
        log(`Agent exited with status=${result.status ?? '?'} signal=${result.signal ?? 'none'}`);
    }
}

function runTask(root: string, fixAgentDir: string, reportDir: string, task: FixTask): void {
    const sanitizedWorktreeName = task.branch.replaceAll('/', '-').replace(/[^a-zA-Z0-9_-]/g, '_');
    const worktreePath = join(tmpdir(), sanitizedWorktreeName);

    const webCount = task.validations.filter(v => v.platform === 'web').length;
    const desktopCount = task.validations.filter(v => v.platform === 'desktop').length;

    log(`━━━ Task ${task.id} ━━━`);
    log(`Scope:   ${task.fix_scope}`);
    log(`Branch:  ${task.branch}`);
    log(`Web:     ${webCount}  Desktop: ${desktopCount}`);

    setupWorktree(root, task, worktreePath);
    log('Worktree ready.\n');

    runAgent(root, fixAgentDir, reportDir, task, worktreePath);
    log(`Agent done. Processing results.`);

    publishPR({ worktreePath, branch: task.branch });
}

function main(): void {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const fixAgentDir = join(root, 'packages/e2e-utils/src/fixBot');
    const reportDir = join(fixAgentDir, 'reports');

    const reportPath = process.argv[2] ?? latestReport(reportDir);
    const report = ReportSchema.parse(JSON.parse(readFileSync(reportPath, 'utf-8')));

    const tasks = report.fix_tasks.filter(isAutomatable);
    log(`${tasks.length} automatable task(s) in ${reportPath}\n`);

    for (const task of tasks) {
        try {
            runTask(root, fixAgentDir, reportDir, task);
        } catch (err) {
            error(`Task ${task.id} failed: ${err}`);
        }
    }
}

main();
