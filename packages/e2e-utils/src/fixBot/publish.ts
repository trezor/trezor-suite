import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { error, log } from '../logger';
import { getErrorText } from './common';
import { type FixResult, FixResultSchema, type SlackFixSummary } from './schemas';

const BASE_BRANCH = 'develop';
const GIT_REMOTE = 'origin';
const QA_PROJECT_NUMBER = 78; // QA and Test Automation
const PUSH_ATTEMPTS = 3;
const PUSH_RETRY_DELAY_S = 5;

function writeSummary(root: string, summary: SlackFixSummary): void {
    writeFileSync(
        join(root, `slack-fix-summary-${summary.taskId}.json`),
        JSON.stringify(summary, null, 2),
    );
    log('Slack summary written.');
}

function readCostUsd(): number | null {
    const path = process.env.LLM_TOKEN_USAGE_FILE ?? '/tmp/llm-token-usage.json';
    try {
        const usage = JSON.parse(readFileSync(path, 'utf-8'));

        return typeof usage.total_cost_usd === 'number' ? usage.total_cost_usd : null;
    } catch {
        return null;
    }
}

function sleepSync(ms: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function shouldPublish(result: FixResult['result']): boolean {
    return result === 'pass' || result === 'partial';
}

function pushBranchWithRetry(branch: string): void {
    log(`  → Pushing ${branch} to ${GIT_REMOTE}...`);
    let lastError = '';
    for (let attempt = 1; attempt <= PUSH_ATTEMPTS; attempt++) {
        try {
            execFileSync('git', ['push', '--', GIT_REMOTE, branch], { encoding: 'utf-8' });

            return;
        } catch (err) {
            lastError = getErrorText(err);
            sleepSync(PUSH_RETRY_DELAY_S * 1000);
        }
    }
    throw new Error(`git push failed after ${PUSH_ATTEMPTS} attempts: ${lastError}`);
}

function buildPrArgs(
    branch: string,
    root: string,
    fixResult: FixResult,
    costUsd: number | null,
): string[] {
    const args = [
        'pr',
        'create',
        '--title',
        fixResult.prTitle,
        '--head',
        branch,
        '--base',
        BASE_BRANCH,
    ];
    const prDescriptionFile = join(root, 'pr-description.md');

    if (existsSync(prDescriptionFile)) {
        if (costUsd !== null) {
            appendFileSync(prDescriptionFile, `\n\n### Agent cost\n~$${costUsd.toFixed(2)}\n`);
        }
        args.push('--body-file', prDescriptionFile);
    } else {
        args.push(
            '--body',
            [
                '## Nightly fix',
                'PR description file not found.',
                '',
                '```json',
                JSON.stringify({ results: fixResult }, null, 2),
                '```',
            ].join('\n'),
        );
    }

    return args;
}

function createPr(args: string[]): string {
    const url = execFileSync('gh', args, { encoding: 'utf-8' }).trim();
    log(`PR: ${url}`);

    return url;
}

function assignToProject(prUrl: string): void {
    const args = [
        'project',
        'item-add',
        String(QA_PROJECT_NUMBER),
        '--owner',
        'trezor',
        '--url',
        prUrl,
    ];
    execFileSync('gh', args, { encoding: 'utf-8' });
    log(`Assigned PR to QA and Test Automation project (#${QA_PROJECT_NUMBER})`);
}

function runPublish(
    branch: string,
    root: string,
    fixResult: FixResult,
    summary: SlackFixSummary,
): void {
    try {
        pushBranchWithRetry(branch);
        const prArgs = buildPrArgs(branch, root, fixResult, summary.costUsd);
        summary.prUrl = createPr(prArgs);
        assignToProject(summary.prUrl);
    } catch (err) {
        summary.error = getErrorText(err);
        error(`Publish failed: ${summary.error}`);
        process.exitCode = 1;
    }
}

function publishPR(): void {
    const branch = process.env.BRANCH;

    if (!branch) {
        error('BRANCH env var is required');
        process.exit(1);
    }

    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const resultFile = join(root, 'fix-result.json');

    if (!existsSync(resultFile)) {
        error(`Result: ❌  fix-result.json missing — agent did not complete`);
        error(`         expected at: ${resultFile}`);

        return;
    }

    const fixResult = FixResultSchema.parse(JSON.parse(readFileSync(resultFile, 'utf-8')));
    const summary: SlackFixSummary = {
        ...fixResult,
        prUrl: null,
        costUsd: readCostUsd(),
        error: null,
    };

    log(`Raw result summary: \n\n${JSON.stringify(summary, null, 2)}`);

    if (shouldPublish(fixResult.result)) {
        runPublish(branch, root, fixResult, summary);
    } else {
        log('Fix bot failed to apply fix or issue was not duplicated → No branch pushed.');
    }

    writeSummary(root, summary);
}

publishPR();
