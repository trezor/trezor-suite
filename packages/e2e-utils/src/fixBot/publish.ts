import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../logger';
import { type FixResult, FixResultSchema } from './schemas';

const BASE_BRANCH = 'develop';
const GIT_REMOTE = 'origin';

const ICONS: Record<FixResult['result'], string> = {
    pass: '✅',
    partial: '⚠️',
    fail: '❌',
    not_duplicated: '🔵',
};

function publishPR(): void {
    const branch = process.env.BRANCH;

    if (!branch) {
        log('BRANCH env var is required');
        process.exit(1);
    }

    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const resultFile = join(root, 'fix-result.json');

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

    if (result === 'not_duplicated') {
        log('  → No branch pushed (failure not reproduced in pre-flight).');

        return;
    }

    log(`  → Pushing ${branch} to ${GIT_REMOTE}...`);
    // TODO: add --force-with-lease to handle retries when branch was already pushed in a previous run
    execFileSync('git', ['push', '--', GIT_REMOTE, branch], { stdio: 'inherit' });

    const prDescriptionFile = join(root, 'pr-description.md');
    const prArgs = ['pr', 'create', '--title', pr_title, '--head', branch, '--base', BASE_BRANCH];

    if (existsSync(prDescriptionFile)) prArgs.push('--body-file', prDescriptionFile);

    // TODO: if 'gh pr create' errors because a PR for this branch already exists, catch it
    // and print the existing PR URL instead (e.g. via `gh pr list --head <branch> --json url`)
    const prUrl = execFileSync('gh', prArgs, { encoding: 'utf-8' }).trim();
    log(`PR: ${prUrl}`);
}

publishPR();
