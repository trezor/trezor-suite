import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prettifyError } from 'zod';

import { error, log } from '../logger';
import { loadLedger, runAgent } from './common';
import { reportToSlack } from './errors';
import { AnalysisReportJsonSchema, AnalysisReportSchema } from './schemas';

const MODEL = 'claude-opus-4-8';
const MAX_BUDGET_USD = 10;
const TIMEOUT_MS = 45 * 60 * 1000;

function buildLedgerPromptSection(ledgerPath: string): string {
    const ledger = loadLedger(ledgerPath);

    if (ledger.entries.length === 0) {
        return '\n\n---\n\n## Known-failures ledger\n\n_Empty — every failure is new; skip the ledger-match rule (Step 7, rule 1)._\n';
    }

    return `\n\n---\n\n## Known-failures ledger\n\nFailures seen on previous runs. Follow the matching rules in the prompt.\n\n\`\`\`json\n${JSON.stringify(ledger.entries, null, 2)}\n\`\`\`\n`;
}

async function main(): Promise<void> {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();

    config({ path: join(root, 'packages/e2e-utils/.env') });

    if (!process.env.CURRENTS_API_KEY) {
        error('CURRENTS_API_KEY is not set. It must be provided via the workflow environment.');
        reportToSlack('CURRENTS_API_KEY is not set, so no nightly runs could be analyzed.');
        process.exit(1);
    }

    const botDir = join(root, 'packages/e2e-utils/src/fixBot');
    const reportDir = join(botDir, 'reports');
    const ledgerPath = join(root, 'ledger.json');
    const analysisPromptPath = join(botDir, 'ANALYSIS_AGENT.md');
    const analysisPromptWithLedger =
        readFileSync(analysisPromptPath, 'utf-8') + buildLedgerPromptSection(ledgerPath);

    mkdirSync(reportDir, { recursive: true });

    log('Starting nightly test failure analysis...');

    const {
        result,
        timedOut,
        error: runError,
    } = await runAgent({
        root,
        agent: 'nightlyAnalyzer',
        prompt: analysisPromptWithLedger,
        model: MODEL,
        outputSchema: AnalysisReportJsonSchema,
        maxBudgetUsd: MAX_BUDGET_USD,
        timeoutMs: TIMEOUT_MS,
        mcpServers: {
            currents: {
                command: 'npx',
                args: ['-y', '@currents/mcp'],
                env: { CURRENTS_API_KEY: process.env.CURRENTS_API_KEY },
            },
        },
        allowedTools: ['mcp__currents__*'],
    });

    if (timedOut) {
        error(
            `Analysis agent exceeded the ${TIMEOUT_MS / 60000}-minute timeout and was killed; no report produced.`,
        );
        reportToSlack('Analysis agent hit its timeout and was killed; no report was produced.');
        process.exit(1);
    }

    if (runError) {
        error(`Failed to run the analysis agent: ${runError}`);
        reportToSlack('Analysis agent could not be started; no report was produced.');
        process.exit(1);
    }

    if (result?.subtype !== 'success') {
        error(`Analysis agent ended with '${result?.subtype ?? 'no result'}'; no report produced.`);
        reportToSlack('Analysis agent ended without a result; no report was produced.');
        process.exit(1);
    }

    const reportJsonPath = join(reportDir, 'report.json');
    const report = AnalysisReportSchema.safeParse(result.structured_output);
    if (!report.success) {
        writeFileSync(reportJsonPath, `${JSON.stringify(result.structured_output, null, 2)}\n`);
        error(`structured output failed schema validation: ${prettifyError(report.error)}`);
        reportToSlack(
            "Analysis agent's report did not match the expected schema; no fix tasks were created.",
        );
        process.exit(1);
    }

    writeFileSync(reportJsonPath, `${JSON.stringify(report.data, null, 2)}\n`);

    log('Agent done.');
}

main().catch(e => {
    error(`Analysis run failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
});
