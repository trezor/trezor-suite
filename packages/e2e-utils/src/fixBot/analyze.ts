import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prettifyError } from 'zod';

import { error, log } from '../logger';
import { processAgentOutput, runClaude } from './common';
import { ReportSchema } from './schemas';

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
    processAgentOutput(claudeOutput, 'nightlyAnalyzer', model);

    if (spawnError) {
        error(`Failed to run claude: ${spawnError.message}`);
        process.exit(1);
    }

    const reportMd = join(reportDir, 'report.md');
    const reportJson = join(reportDir, 'report.json');

    const missing = [reportMd, reportJson].filter(f => !existsSync(f));

    if (missing.length > 0) {
        missing.forEach(f => error(`Expected output not found: ${f}`));
        process.exit(1);
    }

    const unsafeParse = JSON.parse(readFileSync(reportJson, 'utf-8'));
    const report = ReportSchema.safeParse(unsafeParse);
    if (!report.success) {
        error(`report.json failed schema validation: ${prettifyError(report.error)}`);
        process.exit(1);
    }

    log('');
    log(`Report saved to ${reportMd}`);
    log(`Fix tasks saved to ${reportJson}`);
    log('');

    process.exit(status);
}

main();
