import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../logger';
import { type FixResult, FixResultSchema } from './schemas';

export interface PublishOptions {
    worktree: string;
    branch: string;
    base?: string;
    remote?: string;
}

const ICONS: Record<FixResult['result'], string> = {
    pass: '✅',
    partial: '⚠️',
    fail: '❌',
};

export function publishTask({
    worktree,
    branch,
    base = 'develop',
    remote = 'origin',
}: PublishOptions): void {
    const resultFile = join(worktree, 'fix-result.json');

    if (!existsSync(worktree)) {
        log(`Result: ❌  worktree not found: ${worktree}`);

        return;
    }

    if (!existsSync(resultFile)) {
        log(`Result: ❌  fix-result.json missing — agent did not complete`);
        log(`         expected at: ${resultFile}`);

        return;
    }

    const { result, passed, failed, iterations, pr_title } = FixResultSchema.parse(
        JSON.parse(readFileSync(resultFile, 'utf-8')),
    );

    log(
        `Result: ${ICONS[result] ?? '?'} ${result}  passed=${passed.length}  failed=${failed.length}  iterations=${iterations}`,
    );

    if (result === 'fail') {
        log('  → No branch pushed (zero validations pass).');

        return;
    }

    log(`  → Pushing ${branch} to ${remote}...`);
    execFileSync('git', ['-C', worktree, 'push', remote, branch], { stdio: 'inherit' });

    const descFile = join(worktree, 'pr-description.md');
    const prArgs = ['pr', 'create', '--title', pr_title, '--head', branch, '--base', base];

    if (existsSync(descFile)) prArgs.push('--body-file', descFile);

    const prUrl = execFileSync('gh', prArgs, { encoding: 'utf-8' }).trim();
    log(`PR: ${prUrl}`);
}

// Entry point when called directly by GHA matrix jobs:
// tsx publish.ts <worktree> <branch> [base]
const isMain = /publish\.[jt]s$/.test(process.argv[1] ?? '');
if (isMain) {
    const [worktree, branch, title, base] = process.argv.slice(2);
    if (!worktree || !branch || !title) {
        process.stderr.write('Usage: tsx publish.ts <worktree> <branch> <title> [base]\n');
        process.exit(1);
    }
    publishTask({ worktree, branch, base });
}
