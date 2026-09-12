import { config as loadDotenv } from 'dotenv';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { error, log } from '../logger';
import { killHarnessBrowser, killHarnessBrowserOnExitSignals } from './browserState';
import {
    BOT_DIR,
    BROWSER_DIR,
    CONTEXT_FILE,
    REPO_ROOT,
    TEST_RESULT_FILE,
    readJson,
    writeJson,
} from './paths';
import { runOpencode } from './runOpencode';
import { type PrContext, PrContextSchema } from './schemas';

const DEFAULT_BUDGET_USD = 10;
const DEFAULT_TIMEOUT_MIN = 120;

function buildAgentPrompt(context: PrContext): string {
    // Slim brief for the agent prompt — context.json fields minus harness plumbing.
    const brief = {
        prs: context.prs,
        issues: context.issues,
        deviceModel: context.deviceModel,
        contextImages: context.contextImages,
    };

    return [
        readFileSync(join(BOT_DIR, 'AGENT.md'), 'utf-8'),
        '\n\n---\n\n## PR Context\n\n```json\n',
        JSON.stringify(brief, null, 2),
        '\n```\n',
    ].join('');
}

async function main(): Promise<void> {
    loadDotenv({ path: join(REPO_ROOT, 'packages/e2e-utils/.env'), quiet: true });
    killHarnessBrowserOnExitSignals();
    try {
        const budgetUsd = Number(
            process.env.LLM_EXPLORATORY_TESTER_BUDGET_USD ?? DEFAULT_BUDGET_USD,
        );
        const timeoutMs =
            Number(process.env.LLM_EXPLORATORY_TESTER_TIMEOUT_MIN ?? DEFAULT_TIMEOUT_MIN) * 60_000;
        if (!Number.isFinite(budgetUsd) || !Number.isFinite(timeoutMs)) {
            throw new Error(
                'LLM_EXPLORATORY_TESTER_BUDGET_USD and TIMEOUT_MIN must be finite numbers',
            );
        }

        const context = PrContextSchema.parse(readJson(CONTEXT_FILE));
        mkdirSync(BROWSER_DIR, { recursive: true });

        log(`━━━ LLM Exploratory Tester — PR #${context.prNumber} ━━━`);
        log(`Suite: ${context.suiteUrl}`);
        log(`Model: ${context.deviceModel}`);
        log(`Agent: budget $${budgetUsd} · timeout ${timeoutMs / 60_000}min`);

        const prompt = buildAgentPrompt(context);
        log('─── Agent prompt ───');
        log(prompt);
        log('─── End prompt ───');

        const testResult = await runOpencode({ prompt, timeoutMs, maxBudgetUsd: budgetUsd });

        writeJson(TEST_RESULT_FILE, testResult);
        log(`Result: ${testResult.result} — ${testResult.summary}`);
        log('Agent done.');

        // The verdict is the CI signal: a fail must turn the workflow red,
        // not just the downloaded artifact.
        if (testResult.result === 'fail') {
            process.exitCode = 1;
        }
    } finally {
        await killHarnessBrowser();
    }
}

main().catch(e => {
    const message = e instanceof Error ? e.message : String(e);
    error(`run failed: ${message}`);
    // Leave a result file even when the run broke, so the artifact upload and
    // the summary step always have a verdict to show.
    writeJson(TEST_RESULT_FILE, {
        result: 'blocked',
        summary: `Harness error: ${message}`,
        issues: [],
        unfinished: [],
    });
    process.exitCode = 1;
});
