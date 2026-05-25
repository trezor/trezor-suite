import { config as loadEnv } from 'dotenv';
import { execFileSync, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { error, log } from '../logger';
import { logAgentResult, reportTokenUsage } from './reportTokenUsage';

function main(): void {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();

    loadEnv({ path: join(root, 'packages/e2e-utils/.env') });

    if (!process.env.CURRENTS_API_KEY) {
        error('CURRENTS_API_KEY is not set.');
        error('Add it to packages/e2e-utils/.env:');
        error('  CURRENTS_API_KEY=your_key_here');
        process.exit(1);
    }

    const botDir = join(root, 'packages/e2e-utils/src/fixBot');
    const reportDir = join(botDir, 'reports');

    mkdirSync(reportDir, { recursive: true });

    log('Starting nightly test failure analysis...');

    const env = { ...process.env };
    delete env['MCP_CONNECTION_NONBLOCKING'];

    // Write stdout to a temp file to avoid spawnSync's in-memory buffer limit (ENOBUFS).
    const tmpFile = join(tmpdir(), `claude-analyze-${Date.now()}.json`);
    const stdoutFd = openSync(tmpFile, 'w');

    const result = spawnSync(
        join(root, 'node_modules/.bin/claude'),
        [
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
        {
            input: readFileSync(join(botDir, 'ANALYSIS_AGENT.md'), 'utf-8'),
            cwd: root,
            env,
            stdio: ['pipe', stdoutFd, 'inherit'],
        },
    );

    closeSync(stdoutFd);
    const claudeOutput = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    if (result.error) {
        error(`Failed to run claude: ${result.error.message}`);
        process.exit(1);
    }

    const date = new Date().toISOString().slice(0, 10);
    const reportMd = join(reportDir, `${date}.md`);
    const reportJson = join(reportDir, `${date}.json`);

    reportTokenUsage(claudeOutput, join(reportDir, 'token_usage.txt'), 'analysis');
    logAgentResult(claudeOutput, 'analysis');

    const missing = [reportMd, reportJson].filter(f => !existsSync(f));

    if (missing.length > 0) {
        missing.forEach(f => error(`Expected output not found: ${f}`));
        process.exit(1);
    }

    log('');
    log(`Report saved to ${reportMd}`);
    log(`Fix tasks saved to ${reportJson}`);
    log('');

    process.exit(result.status ?? 0);
}

main();
