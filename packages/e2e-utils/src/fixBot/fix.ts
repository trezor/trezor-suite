import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prettifyError } from 'zod';

import { error, log } from '../logger';
import { processAgentOutput, runClaude } from './common';
import { AnalysisReportSchema, FixResultJsonSchema, FixResultSchema } from './schemas';

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

    const report = AnalysisReportSchema.parse(JSON.parse(readFileSync(reportPath, 'utf-8')));
    const task = report.fixTasks.find(t => t.id === taskId);

    if (!task) {
        error(`Task '${taskId}' not found in ${reportPath}`);
        process.exit(1);
    }

    const webCount = task.validations.filter(v => v.platform === 'web').length;
    const desktopCount = task.validations.filter(v => v.platform === 'desktop').length;

    log(`━━━ Task ${task.id} ━━━`);
    log(`Scope:   ${task.fixScope}`);
    log(`Branch:  ${task.branch}`);
    log(`Web:     ${webCount}  Desktop: ${desktopCount}`);

    const prompt = `${readFileSync(join(fixAgentDir, 'FIX_AGENT.md'), 'utf-8')}\n\n---\n\n## Fix Task\n\n\`\`\`json\n${JSON.stringify(task, null, 2)}\n\`\`\`\n`;

    const { output, status, spawnError } = runClaude({
        root,
        args: [
            '--print',
            '--verbose',
            '--output-format',
            'json',
            '--json-schema',
            JSON.stringify(FixResultJsonSchema),
            '--settings',
            join(fixAgentDir, 'settings.json'),
        ],
        input: prompt,
        tmpPrefix: `claude-fix-${task.id}`,
    });

    const { model } = JSON.parse(readFileSync(join(fixAgentDir, 'settings.json'), 'utf-8'));
    const agentResult = processAgentOutput(output, 'nightlyFixer', model);

    if (spawnError) {
        error(`Failed to run claude: ${spawnError.message}`);
        process.exit(1);
    }

    if (!agentResult) {
        error('Could not parse Claude result envelope from fix agent output.');
        process.exit(1);
    }

    if (agentResult.subtype === 'error_max_structured_output_retries') {
        error(
            `Fix agent could not produce schema-conformant output after retries. Raw envelope:\n${output}`,
        );
        process.exit(1);
    }

    const fixResult = FixResultSchema.safeParse(agentResult.structured_output);
    if (!fixResult.success) {
        error(
            `structured output failed schema validation: ${prettifyError(fixResult.error)} \nRaw structured output:\n${JSON.stringify(agentResult.structured_output, null, 2)}`,
        );
        process.exit(1);
    }

    writeFileSync(join(root, 'fix-result.json'), `${JSON.stringify(fixResult.data, null, 2)}\n`);

    log('Agent done.');
    process.exit(status);
}

main();
