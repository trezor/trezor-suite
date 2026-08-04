import { existsSync, readFileSync } from 'node:fs';

import { error, log } from '../logger';
import { githubRunLink, postSlackMessage } from '../slack';
import { readSummaries } from './common';
import { type AnalysisReport, AnalysisReportSchema, type SlackFixSummary } from './schemas';

const DIVIDER = '──────────────────────────────────────';

const RESULT_ICON: Record<SlackFixSummary['result'], string> = {
    pass: '✅',
    partial: '⚠️',
    fail: '❌',
    not_duplicated: '🔵',
};

function formatCost(usd: number): string {
    return `$${usd.toFixed(2)}`;
}

function readAnalysisCost(costFile: string | undefined): number | null {
    if (!costFile || !existsSync(costFile)) return null;
    try {
        const usage = JSON.parse(readFileSync(costFile, 'utf-8'));

        return typeof usage.total_cost_usd === 'number' ? usage.total_cost_usd : null;
    } catch {
        return null;
    }
}

function formatTestRef(validations: AnalysisReport['fixTasks'][number]['validations']): string {
    const first = validations[0];
    if (!first) return 'Test reference not available';
    const extrasPart = validations.length > 1 ? ` (+${validations.length - 1})` : '';

    return `    ${first.spec} [${first.group}]${extrasPart}`;
}

function runLink(): string {
    return githubRunLink('GHA Run') ?? 'local run';
}

function readReport(reportPath: string): AnalysisReport | null {
    try {
        const parsed = AnalysisReportSchema.safeParse(
            JSON.parse(readFileSync(reportPath, 'utf-8')),
        );

        return parsed.success ? parsed.data : null;
    } catch (err) {
        error(`[notify] Could not read report at ${reportPath}: ${String(err)}`);

        return null;
    }
}

function buildMessage(
    report: AnalysisReport,
    summaries: SlackFixSummary[],
    analyzeCost: number | null,
): string {
    const summaryById = new Map(summaries.map(s => [s.taskId, s]));

    const lines: string[] = [];

    // Header
    lines.push(`🤖 *Nightly Fix Agent — ${report.runDate}*  ${runLink()}`);

    // Cost summary
    const fixCosts = summaries.map(s => s.costUsd).filter((c): c is number => c !== null);
    const totalFixCost = fixCosts.reduce((a, b) => a + b, 0);
    const hasCost = analyzeCost !== null || fixCosts.length > 0;

    if (hasCost) {
        const totalCost = (analyzeCost ?? 0) + totalFixCost;
        const parts: string[] = [];

        if (analyzeCost !== null) parts.push(`analysis ${formatCost(analyzeCost)}`);
        if (fixCosts.length > 0) parts.push(`fixes ${formatCost(totalFixCost)}`);

        lines.push(`💰 ~${formatCost(totalCost)} (${parts.join(' · ')})`);
    }

    // Analyzer summary line
    const fixable = report.fixTasks.length;
    const skipped = report.skipped.length;
    lines.push(`*Analyzer* — ${fixable} fixable · ${skipped} skipped`);

    // Fix agents summaries
    if (report.fixTasks.length > 0) {
        lines.push('');
        lines.push(DIVIDER);

        for (const task of report.fixTasks) {
            const summary = summaryById.get(task.id);
            lines.push('');

            if (!summary) {
                // Job was cancelled before publish.ts wrote the summary
                lines.push(`❓ *${task.rootCause}*`);
                lines.push(formatTestRef(task.validations));
                lines.push(`    ${task.id} · job did not complete`);
                continue;
            }

            const { result, passed, failed, iterations, prUrl } = summary;
            const total = passed.length + failed.length;
            const icon = RESULT_ICON[result];
            const iterStr = `${iterations} iter${iterations === 1 ? '' : 's'}`;
            const countStr = `${passed.length}/${total}`;
            const costPart = `${summary.costUsd !== null ? formatCost(summary.costUsd) : 'N/A'}`;

            lines.push(`${icon} *${task.rootCause}*`);
            lines.push(formatTestRef(task.validations));

            if (result === 'not_duplicated') {
                lines.push(`    ${task.id} · preflight passed — not flaky · ${costPart}`);
            } else {
                const prPart = prUrl ? `<${prUrl}|PR link>` : 'no PR';
                lines.push(`    ${task.id} · ${prPart} · ${iterStr} · ${countStr} · ${costPart}`);
            }

            if (summary.error) {
                lines.push(`    ⚠️ publish failed: ${summary.error.split('\n')[0]}`);
            }
        }
    }

    // Skipped
    if (report.skipped.length > 0) {
        lines.push('');
        lines.push(DIVIDER);

        for (const skip of report.skipped) {
            lines.push('');
            lines.push(`⛔ *${skip.reason}* — ${skip.rootCause}`);
            lines.push(formatTestRef(skip.validations));
        }
    }

    return lines.join('\n');
}

async function main(): Promise<void> {
    const reportPath = process.env.REPORT_PATH;
    const summariesDir = process.env.SUMMARIES_DIR;
    const analyzeCostFile = process.env.ANALYZE_COST_FILE;

    if (!reportPath) {
        error('REPORT_PATH env var is required');
        process.exit(1);
    }

    const report = readReport(reportPath);

    if (!report) {
        await postSlackMessage(
            process.env.SLACK_FIX_AGENT_WEBHOOK,
            `🤖 *Nightly Fix Agent*  ${runLink()}\n\n❓ Analysis agent did not complete correctly.`,
        );

        return;
    }

    const summaries = readSummaries(summariesDir);
    const analyzeCost = readAnalysisCost(analyzeCostFile);

    log(`[notify] ${report.fixTasks.length} fix tasks · ${summaries.length} summaries loaded`);

    const message = buildMessage(report, summaries, analyzeCost);

    await postSlackMessage(process.env.SLACK_FIX_AGENT_WEBHOOK, message);
}

main().catch(err => {
    error(`[notify] Unhandled error: ${String(err)}`);
    process.exit(1);
});
