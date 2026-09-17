/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import { readDeviceLogs } from './deviceLogs';
import { resolveReportMeta } from './meta';
import { parsePerformanceLogs } from './parseSamples';
import { buildPerformanceReport, formatPerformanceReport } from './report';

const ARTIFACTS_DIR = 'artifacts';
const REPORT_PATH = path.join(ARTIFACTS_DIR, 'performance', 'perf-report.json');

/**
 * Reads the performance samples the app logged during the run, reduces them to one report and
 * prints it. Over-limit is printed loudly and returned in the report, never turned into a failure.
 */
export const collectPerformanceReport = (detoxConfigurations: readonly string[]): void => {
    const appDir = process.cwd();
    const logs = readDeviceLogs(path.resolve(appDir, ARTIFACTS_DIR));
    const { samples, malformedLineCount } = parsePerformanceLogs(logs);

    if (malformedLineCount > 0) {
        console.warn(
            `[performance] Skipped ${malformedLineCount} unreadable performance log line(s).`,
        );
    }

    if (samples.length === 0) {
        console.log(
            `[performance] No performance samples found in ${logs.length} device log(s); no report written.`,
        );

        return;
    }

    const report = buildPerformanceReport(samples, resolveReportMeta(appDir, detoxConfigurations));
    const reportPath = path.resolve(appDir, REPORT_PATH);

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    console.log(formatPerformanceReport(report));
    console.log(`[performance] Report written to ${REPORT_PATH}`);
};
