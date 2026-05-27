import { execFileSync, spawnSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { error, log } from '../logger';
import { logAgentResult, reportTokenUsage } from './reportTokenUsage';
import { ReportSchema } from './schemas';

function main(): void {
    const reportPath = process.env.REPORT_PATH;
    const taskId = process.env.TASK_ID;

    if (!reportPath) {
        error('REPORT_PATH env var is required');
        process.exit(1);
    }

    if (!taskId) {
        error('TASK_ID env var is required');
        process.exit(1);
    }

    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const fixAgentDir = join(root, 'packages/e2e-utils/src/fixBot');
    const reportDir = join(fixAgentDir, 'reports');

    const report = ReportSchema.parse(JSON.parse(readFileSync(reportPath, 'utf-8')));
    const task = report.fix_tasks.find(t => t.id === taskId);

    if (!task) {
        error(`Task '${taskId}' not found in ${reportPath}`);
        process.exit(1);
    }

    const webCount = task.validations.filter(v => v.platform === 'web').length;
    const desktopCount = task.validations.filter(v => v.platform === 'desktop').length;

    log(`━━━ Task ${task.id} ━━━`);
    log(`Scope:   ${task.fix_scope}`);
    log(`Branch:  ${task.branch}`);
    log(`Web:     ${webCount}  Desktop: ${desktopCount}`);

    const prompt = `${readFileSync(join(fixAgentDir, 'FIX_AGENT.md'), 'utf-8')}\n\n---\n\n## Fix Task\n\n\`\`\`json\n${JSON.stringify(task, null, 2)}\n\`\`\`\n`;

    // Write stdout to a temp file to avoid spawnSync's in-memory buffer limit (ENOBUFS).
    const tmpFile = join(tmpdir(), `claude-fix-${task.id}-${Date.now()}.json`);
    const stdoutFd = openSync(tmpFile, 'w');

    const env = { ...process.env };
    // Prevents an internal Claude Code setting from accidentally being inherited by the subprocess and breaking it
    delete env['MCP_CONNECTION_NONBLOCKING'];

    const result = spawnSync(
        join(root, 'node_modules/.bin/claude'),
        [
            '--print',
            '--verbose',
            '--output-format',
            'json',
            '--settings',
            join(fixAgentDir, 'settings.json'),
        ],
        { input: prompt, cwd: root, env, stdio: ['pipe', stdoutFd, 'inherit'] },
    );

    closeSync(stdoutFd);

    const output = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    reportTokenUsage(output, join(reportDir, 'token_usage.txt'), `fix:${task.id}`);
    logAgentResult(output, `fix:${task.id}`);

    if (result.error) throw result.error;
    if (result.status !== 0 || result.signal) {
        log(`Agent exited with status=${result.status ?? '?'} signal=${result.signal ?? 'none'}`);
    }

    log('Agent done.');
}

main();
