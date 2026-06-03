import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prettifyError } from 'zod';

import { error, log } from '../logger';
import { processAgentOutput, runClaude } from './common';
import { AnalysisReportJsonSchema, AnalysisReportSchema } from './schemas';

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
        ],
        input: readFileSync(join(botDir, 'ANALYSIS_AGENT.md'), 'utf-8'),
        tmpPrefix: 'claude-analyze',
    });

    const { model } = JSON.parse(readFileSync(join(botDir, 'settings.json'), 'utf-8'));
    const agentResult = processAgentOutput(claudeOutput, 'nightlyAnalyzer', model);

    if (spawnError) {
        error(`Failed to run claude: ${spawnError.message}`);
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

    process.exit(status);
}

main();
