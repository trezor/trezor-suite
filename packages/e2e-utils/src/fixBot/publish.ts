import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../logger';
import { type FixResult, FixResultSchema } from './schemas';

export interface PublishOptions {
    worktreePath: string;
    branch: string;
    base?: string;
    remote?: string;
}

const ICONS: Record<FixResult['result'], string> = {
    pass: '✅',
    partial: '⚠️',
    fail: '❌',
};

export function publishPR({
    worktreePath,
    branch,
    base = 'develop',
    remote = 'origin',
}: PublishOptions): void {
    const resultFile = join(worktreePath, 'fix-result.json');

    if (!existsSync(worktreePath)) {
        log(`Result: ❌  worktree not found: ${worktreePath}`);

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
    execFileSync('git', ['-C', worktreePath, 'push', '--', remote, branch], { stdio: 'inherit' });

    const prDescriptionFile = join(worktreePath, 'pr-description.md');
    const prArgs = ['pr', 'create', '--title', pr_title, '--head', branch, '--base', base];

    if (existsSync(prDescriptionFile)) prArgs.push('--body-file', prDescriptionFile);

    const prUrl = execFileSync('gh', prArgs, { encoding: 'utf-8' }).trim();
    log(`PR: ${prUrl}`);
}

// Entry point when called directly by GHA matrix jobs:
// tsx publish.ts <worktreePath> <branch> [base]
const isMain = /publish\.[jt]s$/.test(process.argv[1] ?? '');
if (isMain) {
    const [worktreePath, branch, base] = process.argv.slice(2);
    if (!worktreePath || !branch) {
        process.stderr.write('Usage: tsx publish.ts <worktreePath> <branch> [base]\n');
        process.exit(1);
    }
    publishPR({ worktreePath, branch, base });
}
