import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { error, log, warn } from '../logger';
import {
    type AnalysisReport,
    AnalysisReportSchema,
    type SlackFixSummary,
    SlackFixSummarySchema,
} from './schemas';

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

function readSummaries(summariesDir: string): SlackFixSummary[] {
    if (!existsSync(summariesDir)) return [];

    const parsedSummaries: SlackFixSummary[] = [];
    const allSummariesFiles = readdirSync(summariesDir).filter(
        n => n.startsWith('slack-fix-summary-') && n.endsWith('.json'),
    );
    for (const filename of allSummariesFiles) {
        const parsed = SlackFixSummarySchema.safeParse(
            JSON.parse(readFileSync(join(summariesDir, filename), 'utf-8')),
        );

        if (!parsed.success) {
            warn(`[notify] Failed to parse ${filename}: ${parsed.error.message}`);
            continue;
        }

        parsedSummaries.push(parsed.data);
    }

    return parsedSummaries;
}

function readAnalyzeCost(costFile: string | undefined): number | null {
    if (!costFile || !existsSync(costFile)) return null;
    try {
        const usage = JSON.parse(readFileSync(costFile, 'utf-8'));

        return typeof usage.total_cost_usd === 'number' ? usage.total_cost_usd : null;
    } catch {
        return null;
    }
}

function buildMessage(
    report: AnalysisReport,
    summaries: SlackFixSummary[],
    analyzeCost: number | null,
): string {
    const runId = process.env.GITHUB_RUN_ID ?? '';
    const repo = process.env.GITHUB_REPOSITORY ?? 'trezor/trezor-suite';
    const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;

    const summaryById = new Map(summaries.map(s => [s.task_id, s]));

    const lines: string[] = [];

    // Header
    lines.push(`🤖 *Nightly Fix Agent — ${report.run_date}*  <${runUrl}|GHA Run>`);
    lines.push('');

    // Analyzer summary line
    const fixable = report.fix_tasks.length;
    const skipped = report.skipped.length;
    lines.push(`*Analyzer* — ${fixable} fixable · ${skipped} skipped`);

    for (const skip of report.skipped) {
        lines.push(`> ⛔ ${skip.reason} — ${skip.root_cause}`);
    }

    // Fix agents summaries
    if (report.fix_tasks.length > 0) {
        lines.push('');
        lines.push(DIVIDER);

        for (const task of report.fix_tasks) {
            const summary = summaryById.get(task.id);
            lines.push('');

            if (!summary) {
                // Job was cancelled before publish.ts wrote the summary
                lines.push(`❓ *${task.root_cause}*`);
                lines.push(`    ${task.id} · ${task.fix_scope} · job did not complete`);
                continue;
            }

            const { result, passed, failed, iterations, pr_url } = summary;
            const total = passed.length + failed.length;
            const icon = RESULT_ICON[result];
            const iterStr = `${iterations} iter${iterations === 1 ? '' : 's'}`;
            const countStr = `${passed.length}/${total}`;

            lines.push(`${icon} *${task.root_cause}*`);

            if (result === 'not_duplicated') {
                lines.push(`    ${task.id} · ${task.fix_scope} · preflight passed — not flaky`);
            } else {
                const prPart = pr_url ? `<${pr_url}|PR link>` : 'no PR';
                lines.push(
                    `    ${task.id} · ${task.fix_scope} · ${prPart} · ${iterStr} · ${countStr}`,
                );
            }
        }
    }

    // Cost footer
    const fixCosts = summaries.map(s => s.cost_usd).filter((c): c is number => c !== null);
    const totalFixCost = fixCosts.reduce((a, b) => a + b, 0);
    const hasCost = analyzeCost !== null || fixCosts.length > 0;

    if (hasCost) {
        const totalCost = (analyzeCost ?? 0) + totalFixCost;
        const parts: string[] = [];

        if (analyzeCost !== null) parts.push(`analysis ${formatCost(analyzeCost)}`);
        if (fixCosts.length > 0) parts.push(`fixes ${formatCost(totalFixCost)}`);

        lines.push('');
        lines.push(DIVIDER);
        lines.push(`💰 ~${formatCost(totalCost)} (${parts.join(' · ')})`);
    }

    return lines.join('\n');
}

async function sendSlackNotification(message: string): Promise<void> {
    const webhook = process.env.SLACK_FIX_AGENT_WEBHOOK;

    if (!webhook) {
        log('[notify] No SLACK_FIX_AGENT_WEBHOOK configured, skipping notification.');
        log(`[notify] Message would have been:\n${message}`);

        return;
    }

    const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
    });

    if (!res.ok) {
        warn(`[notify] Failed to send Slack notification: ${res.status}`);
    } else {
        log('[notify] Slack notification sent.');
    }
}

async function main(): Promise<void> {
    const reportPath = process.env.REPORT_PATH;
    const summariesDir = process.env.SUMMARIES_DIR;
    const analyzeCostFile = process.env.ANALYZE_COST_FILE;

    if (!reportPath) {
        error('REPORT_PATH env var is required');
        process.exit(1);
    }

    const report = AnalysisReportSchema.parse(JSON.parse(readFileSync(reportPath, 'utf-8')));
    const summaries = summariesDir ? readSummaries(summariesDir) : [];
    const analyzeCost = readAnalyzeCost(analyzeCostFile);

    log(`[notify] ${report.fix_tasks.length} fix tasks · ${summaries.length} summaries loaded`);

    const message = buildMessage(report, summaries, analyzeCost);

    await sendSlackNotification(message);
}

main().catch(err => {
    error(`[notify] Unhandled error: ${String(err)}`);
    process.exit(1);
});
