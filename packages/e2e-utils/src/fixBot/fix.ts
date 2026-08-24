import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prettifyError } from 'zod';

import { error, log } from '../logger';
import { runAgent } from './common';
import { AnalysisReportSchema, FixResultJsonSchema, FixResultSchema } from './schemas';

const MODEL = 'claude-opus-5';
const MAX_BUDGET_USD = 10;
const TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours

async function main(): Promise<void> {
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
    log(`Branch:  ${task.branch}`);
    log(`Web:     ${webCount}  Desktop: ${desktopCount}`);

    const prompt = `${readFileSync(join(fixAgentDir, 'FIX_AGENT.md'), 'utf-8')}\n\n---\n\n## Fix Task\n\n\`\`\`json\n${JSON.stringify(task, null, 2)}\n\`\`\`\n`;

    const {
        result,
        timedOut,
        error: runError,
    } = await runAgent({
        root,
        agent: 'nightlyFixer',
        prompt,
        model: MODEL,
        outputSchema: FixResultJsonSchema,
        maxBudgetUsd: MAX_BUDGET_USD,
        timeoutMs: TIMEOUT_MS,
    });

    if (timedOut) {
        error(
            `Fix agent exceeded the ${TIMEOUT_MS / 60000}-minute timeout and was killed; no result produced.`,
        );
        process.exit(1);
    }

    if (runError) {
        error(`Failed to run the fix agent: ${runError.message}`);
        process.exit(1);
    }

    if (result?.subtype !== 'success') {
        error(`Fix agent ended with '${result?.subtype ?? 'no result'}'; no result produced.`);
        process.exit(1);
    }

    const fixResult = FixResultSchema.safeParse(result.structured_output);
    if (!fixResult.success) {
        error(
            `structured output failed schema validation: ${prettifyError(fixResult.error)} \nRaw structured output:\n${JSON.stringify(result.structured_output, null, 2)}`,
        );
        process.exit(1);
    }

    writeFileSync(join(root, 'fix-result.json'), `${JSON.stringify(fixResult.data, null, 2)}\n`);

    const prDescriptionFile = join(root, 'pr-description.md');
    if (existsSync(prDescriptionFile)) {
        log(`PR description:\n\n${readFileSync(prDescriptionFile, 'utf-8')}`);
    } else {
        log('No pr-description.md written by the agent.');
    }

    log('Agent done.');
}

main().catch(e => {
    error(`Fix run failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
});
