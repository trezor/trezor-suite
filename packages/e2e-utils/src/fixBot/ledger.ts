import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { error, log, warn } from '../logger';
import { readSummaries } from './common';
import {
    type AnalysisReport,
    AnalysisReportSchema,
    type Ledger,
    type LedgerEntry,
    type SlackFixSummary,
} from './schemas';

function buildLedger(report: AnalysisReport, summaries: SlackFixSummary[], today: string): Ledger {
    const summaryByTaskId = new Map(summaries.map(s => [s.taskId, s]));
    const entries: LedgerEntry[] = [];

    entries.push(...report.skipped);

    for (const fixTask of report.fixTasks) {
        const result = summaryByTaskId.get(fixTask.id)?.result;
        if (!result || result === 'not_duplicated') {
            warn(`[ledger] no summary result for task ${fixTask.id} — skipping ledger entry.`);
            continue;
        }

        entries.push({
            reason: result === 'fail' ? 'FIX_FAILED' : 'FIX_DELIVERED',
            rootCause: fixTask.rootCause,
            validations: fixTask.validations,
        });
    }

    return { version: 1, updatedAt: today, entries };
}

function main(): void {
    const reportPath = process.env.REPORT_PATH;
    const summariesDir = process.env.SUMMARIES_DIR;

    if (!reportPath) {
        error('REPORT_PATH env var is required');
        process.exit(1);
    }

    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf-8',
    }).trim();
    const ledgerFilePath = join(root, 'ledger.json');

    const report = AnalysisReportSchema.safeParse(JSON.parse(readFileSync(reportPath, 'utf-8')));
    if (!report.success) {
        error(`[update-ledger] report.json failed schema validation: ${report.error.message}`);
        process.exit(1);
    }

    const { summaries } = readSummaries(summariesDir);
    const newLedger = buildLedger(report.data, summaries, report.data.runDate);

    writeFileSync(ledgerFilePath, `${JSON.stringify(newLedger, null, 2)}\n`);
    log(`[update-ledger] Ledger entries:\n\n${JSON.stringify(newLedger.entries, null, 2)}`);
}

main();
