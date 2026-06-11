import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prettifyError } from 'zod';

import { error, log } from '../logger';
import { loadLedger, processAgentOutput, runClaude } from './common';
import { AnalysisReportJsonSchema, AnalysisReportSchema } from './schemas';

const MAX_BUDGET_USD = '10';
const TIMEOUT_MS = 45 * 60 * 1000;

function buildLedgerPromptSection(ledgerPath: string): string {
    const ledger = loadLedger(ledgerPath);

    if (ledger.entries.length === 0) {
        return '\n\n---\n\n## Known-failures ledger\n\n_Empty — every failure is new; skip the ledger-match rule (Step 7, rule 1)._\n';
    }

    return `\n\n---\n\n## Known-failures ledger\n\nFailures seen on previous runs. Follow the matching rules in the prompt.\n\n\`\`\`json\n${JSON.stringify(ledger.entries, null, 2)}\n\`\`\`\n`;
}

function main(): void {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();

    if (!process.env.CURRENTS_API_KEY) {
        error('CURRENTS_API_KEY is not set. It must be provided via the workflow environment.');
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
        output: claudeOutput,
        status,
        spawnError,
    } = runClaude({
        root,
        args: [
            '--print',
            '--verbose',
            '--output-format',
            'json',
            '--json-schema',
            JSON.stringify(AnalysisReportJsonSchema),
            '--settings',
            join(botDir, 'settings.json'),
            '--mcp-config',
            join(botDir, 'mcp.json'),
            '--strict-mcp-config',
            '--max-budget-usd',
            MAX_BUDGET_USD,
        ],
        input: analysisPromptWithLedger,
        tmpPrefix: 'claude-analyze',
        timeoutMs: TIMEOUT_MS,
    });

    const { model } = JSON.parse(readFileSync(join(botDir, 'settings.json'), 'utf-8'));
    const agentResult = processAgentOutput(claudeOutput, 'nightlyAnalyzer', model);

    if (spawnError) {
        const timedOut = (spawnError as NodeJS.ErrnoException).code === 'ETIMEDOUT';
        error(
            timedOut
                ? `Analysis agent exceeded the ${TIMEOUT_MS / 60000}-minute timeout and was killed; no report produced.`
                : `Failed to run claude: ${spawnError.message}`,
        );
        process.exit(1);
    }

    if (!agentResult) {
        error('Could not parse Claude result envelope from analysis agent output.');
        process.exit(1);
    }

    if (agentResult.subtype === 'error_max_structured_output_retries') {
        // Persist the raw CLI envelope for troubleshooting
        const envelopePath = join(reportDir, 'analyze-envelope.json');
        writeFileSync(envelopePath, claudeOutput);
        error(
            `Analysis agent could not produce schema-conformant output after retries. Raw envelope saved to ${envelopePath}.`,
        );
        process.exit(1);
    }

    const reportJsonPath = join(reportDir, 'report.json');
    const report = AnalysisReportSchema.safeParse(agentResult.structured_output);
    if (!report.success) {
        // Persist the raw structured output anyway for troubleshooting
        writeFileSync(
            reportJsonPath,
            `${JSON.stringify(agentResult.structured_output, null, 2)}\n`,
        );
        error(`structured output failed schema validation: ${prettifyError(report.error)}`);
        process.exit(1);
    }

    writeFileSync(reportJsonPath, `${JSON.stringify(report.data, null, 2)}\n`);

    log('Agent done.');

    process.exit(status ?? 1);
}

main();
