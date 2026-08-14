import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { error, log } from '../logger';
import { killHarnessBrowser, killHarnessBrowserOnExitSignals } from './browserState';
import { BOT_DIR, BROWSER_DIR, CONTEXT_FILE, TEST_RESULT_FILE, readJson, writeJson } from './paths';
import { processAgentOutput, runClaude } from './runClaude';
import { type PrContext, PrContextSchema, TestResultJsonSchema, TestResultSchema } from './schemas';

const DEFAULT_BUDGET_USD = '10';
const DEFAULT_TIMEOUT_MIN = 120;

function buildAgentPrompt(context: PrContext): string {
    // Slim brief for the agent prompt — context.json fields minus harness plumbing.
    const brief = {
        prNumber: context.prNumber,
        prTitle: context.prTitle,
        prBody: context.prBody,
        issue: context.issue && {
            number: context.issue.number,
            title: context.issue.title,
            body: context.issue.body,
        },
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
    killHarnessBrowserOnExitSignals();
    try {
        const budgetUsd = process.env.LLM_EXPLORATORY_TESTER_BUDGET_USD ?? DEFAULT_BUDGET_USD;
        const timeoutMs =
            Number(process.env.LLM_EXPLORATORY_TESTER_TIMEOUT_MIN ?? DEFAULT_TIMEOUT_MIN) * 60_000;

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

        const { output, status } = await runClaude({
            args: [
                '--print',
                '--verbose',
                '--output-format',
                'stream-json',
                '--json-schema',
                JSON.stringify(TestResultJsonSchema),
                '--settings',
                join(BOT_DIR, 'settings.json'),
                '--mcp-config',
                join(BOT_DIR, 'mcp.json'),
                '--strict-mcp-config',
                '--setting-sources',
                '',
                '--max-budget-usd',
                budgetUsd,
            ],
            input: prompt,
            timeoutMs,
        });

        const result = processAgentOutput(output);
        const testResult = TestResultSchema.parse(result.structured_output);

        writeJson(TEST_RESULT_FILE, testResult);
        log(`Result: ${testResult.result} — ${testResult.summary}`);
        log('Agent done.');

        process.exitCode = status ?? 1;
    } finally {
        await killHarnessBrowser();
    }
}

main().catch(e => {
    error(`run failed: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
});
