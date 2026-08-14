import { execFileSync } from 'node:child_process';

import { log } from '../logger';
import { CONTEXT_FILE, TEST_RESULT_FILE, readJson } from './paths';
import { PrContextSchema, TestResultSchema } from './schemas';
import { parseTarget } from './target';

const REPO = 'trezor/trezor-suite';

function main(): void {
    // Reply where `/e2e-test` was posted — the PR or the issue.
    const target = parseTarget(process.env.TARGET);
    const context = PrContextSchema.parse(readJson(CONTEXT_FILE));
    const testResult = TestResultSchema.parse(readJson(TEST_RESULT_FILE));

    const body = [
        `## LLM Exploratory Tester — ${testResult.result.toUpperCase()}`,
        '',
        testResult.summary,
        '',
        ...testResult.issues.map(
            issue => `- **${issue.severity}** ${issue.title} — ${issue.description}`,
        ),
        '',
        `PR: ${context.prUrl} · Device: \`${context.deviceModel}\` emulator · Suite: ${context.suiteUrl} · [Screenshots and report](${process.env.RUN_URL})`,
    ].join('\n');

    // The issues API takes both issue and PR numbers.
    execFileSync(
        'gh',
        ['api', `repos/${REPO}/issues/${target.number}/comments`, '-f', `body=${body}`],
        { stdio: ['ignore', 'ignore', 'inherit'] },
    );
    log(`Commented on ${target.kind} #${target.number}`);
}

main();
