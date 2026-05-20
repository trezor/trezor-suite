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
import { publishTask } from './publish';
import { logAgentResult, reportTokenUsage } from './reportTokenUsage';

interface Validation {
    platform: 'web' | 'desktop';
    group: string;
    spec: string;
}

interface FixTask {
    id: string;
    branch: string;
    root_cause: string;
    fix_scope: 'TEST_CODE' | 'LOCATOR_ADD' | 'PRODUCT_BUG' | 'INFRA';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    validations: Validation[];
}

interface Report {
    fix_tasks: FixTask[];
}

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

function setupWorktree(root: string, task: FixTask, worktree: string): void {
    if (existsSync(worktree)) {
        execFileSync('git', ['worktree', 'remove', worktree, '--force']);
    }
    try {
        execFileSync('git', ['branch', '-D', task.branch]);
    } catch {
        // branch doesn't exist yet on first run
    }

    execFileSync('git', ['worktree', 'add', worktree, '-b', task.branch, 'develop']);
    symlinkSync(join(root, 'node_modules'), join(worktree, 'node_modules'));
    // disable default git hooks
    execFileSync('git', ['-C', worktree, 'config', 'core.hooksPath', join(worktree, '.husky')]);

    const envFile = join(root, 'suite/e2e/.env');
    if (existsSync(envFile)) {
        cpSync(envFile, join(worktree, 'suite/e2e/.env'));
    }

    for (const dir of ['packages/suite-desktop/dist', 'packages/suite-desktop/build'] as const) {
        const src = join(root, dir);
        if (existsSync(src)) {
            mkdirSync(join(worktree, dirname(dir)), { recursive: true });
            symlinkSync(src, join(worktree, dir));
        }
    }
}

function runAgent(
    root: string,
    botDir: string,
    reportDir: string,
    task: FixTask,
    worktree: string,
): void {
    const prompt = `${readFileSync(join(botDir, 'FIX_AGENT.md'), 'utf-8')}\n\n---\n\n## Fix Task\n\n\`\`\`json\n${JSON.stringify(task, null, 2)}\n\`\`\`\n`;

    const tmpFile = join(tmpdir(), `claude-fix-${task.id}-${Date.now()}.json`);
    const stdoutFd = openSync(tmpFile, 'w');

    const env = { ...process.env };
    delete env['MCP_CONNECTION_NONBLOCKING'];

    const result = spawnSync(
        join(root, 'node_modules/.bin/claude'),
        [
            '--verbose',
            '--print',
            '--output-format',
            'json',
            '--settings',
            join(botDir, 'settings.json'),
        ],
        { input: prompt, cwd: worktree, env, stdio: ['pipe', stdoutFd, 'inherit'] },
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

function commitCount(worktree: string): number {
    try {
        return parseInt(
            execFileSync('git', ['-C', worktree, 'rev-list', '--count', 'origin/develop..HEAD'], {
                encoding: 'utf-8',
            }).trim(),
            10,
        );
    } catch {
        return -1;
    }
}

function runTask(root: string, botDir: string, reportDir: string, task: FixTask): void {
    const worktree = join(tmpdir(), task.branch.replaceAll('/', '-'));

    const webCount = task.validations.filter(v => v.platform === 'web').length;
    const desktopCount = task.validations.filter(v => v.platform === 'desktop').length;

    log(`━━━ Task ${task.id} ━━━`);
    log(`Scope:   ${task.fix_scope}`);
    log(`Branch:  ${task.branch}`);
    log(`Web:     ${webCount}  Desktop: ${desktopCount}`);

    setupWorktree(root, task, worktree);
    log('Worktree ready.\n');

    runAgent(root, botDir, reportDir, task, worktree);
    log(`Agent done. Commits on branch: ${commitCount(worktree)}`);

    publishTask({ worktree, branch: task.branch });
}

function main(): void {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const botDir = join(root, 'packages/e2e-utils/src/fixBot');
    const reportDir = join(botDir, 'reports');

    const reportPath = process.argv[2] ?? latestReport(reportDir);
    const report: Report = JSON.parse(readFileSync(reportPath, 'utf-8'));

    const tasks = report.fix_tasks.filter(isAutomatable);
    log(`${tasks.length} automatable task(s) in ${reportPath}\n`);

    for (const task of tasks) {
        try {
            runTask(root, botDir, reportDir, task);
        } catch (err) {
            error(`Task ${task.id} failed: ${err}`);
        }
    }
}

main();
