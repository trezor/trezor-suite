/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import xml2js from 'xml2js';

import type { Action } from './quarantine';
import { getTitlePath, isQuarantined } from './quarantine';

/** Remove skipped testcases from a suite that don't match the grep regex. */
const filterSuiteByGrep = (suite: any, regex: RegExp): void => {
    suite.testcase = suite.testcase.filter((tc: any) => {
        const isSkipped = tc.skipped !== undefined;
        if (!isSkipped) return true;

        return regex.test(tc.$.name);
    });
};

/** Convert quarantined failures/errors in a suite to skipped and update suite-level counters. */
const applySuiteQuarantine = (
    suite: any,
    projectName: string,
    quarantinedActions: Action[],
): void => {
    let quarantinedFailures = 0;
    let quarantinedErrors = 0;

    suite.testcase.forEach((tc: any) => {
        const hasFailure = tc.failure !== undefined;
        const hasError = tc.error !== undefined;
        if (!hasFailure && !hasError) return;

        const identity = {
            testTitle: tc.$?.name ?? '',
            titlePath: getTitlePath(suite.$?.name ?? '', tc),
        };

        if (!isQuarantined(identity, quarantinedActions)) return;

        console.log(`[quarantine] Marking as skipped: ${identity.testTitle}`);

        if (hasFailure) {
            delete tc.failure;
            quarantinedFailures++;
        }
        if (hasError) {
            delete tc.error;
            quarantinedErrors++;
        }
        tc.skipped = [{}];
    });

    const quarantinedCount = quarantinedFailures + quarantinedErrors;
    if (quarantinedCount === 0 || !suite.$) return;

    if (quarantinedFailures > 0) {
        suite.$.failures = String(
            Math.max(0, parseInt(suite.$.failures ?? '0', 10) - quarantinedFailures),
        );
    }
    if (quarantinedErrors > 0) {
        suite.$.errors = String(
            Math.max(0, parseInt(suite.$.errors ?? '0', 10) - quarantinedErrors),
        );
    }
    suite.$.skipped = String(parseInt(suite.$.skipped ?? '0', 10) + quarantinedCount);

    console.log(
        `[quarantine] ${projectName}/${suite.$?.name ?? 'suite'}: ${quarantinedCount} test(s) quarantined (${quarantinedFailures} failure(s), ${quarantinedErrors} error(s)).`,
    );
};

/** Recompute root <testsuites> aggregate counters from the (now-updated) <testsuite> children. */
const recomputeAggregates = (testsuites: any): void => {
    if (!testsuites.$) return;

    const totals = testsuites.testsuite.reduce(
        (acc: { failures: number; errors: number; skipped: number }, suite: any) => ({
            failures: acc.failures + parseInt(suite.$?.failures ?? '0', 10),
            errors: acc.errors + parseInt(suite.$?.errors ?? '0', 10),
            skipped: acc.skipped + parseInt(suite.$?.skipped ?? '0', 10),
        }),
        { failures: 0, errors: 0, skipped: 0 },
    );

    testsuites.$.failures = String(totals.failures);
    testsuites.$.errors = String(totals.errors);
    testsuites.$.skipped = String(totals.skipped);
};

const hasAnyFailures = (testsuites: any): boolean =>
    testsuites.testsuite.some(
        (suite: any) =>
            parseInt(suite.$?.failures ?? '0', 10) > 0 || parseInt(suite.$?.errors ?? '0', 10) > 0,
    );

/**
 * Process the JUnit XML report for a project.
 * - Filters out skipped tests that don't match grep.
 * - When quarantinedActions are provided, converts failing testcases that are
 *   quarantined into skipped ones and adjusts suite-level counters.
 *
 * Returns true when there are still genuine (non-quarantined) failures remaining,
 * false when every failure was quarantined (or there were no failures).
 */
export const processJUnitReport = async (
    projectName: string,
    detoxFailed: boolean,
    grep?: string,
    quarantinedActions: Action[] = [],
): Promise<boolean> => {
    const reportPath = path.resolve(process.cwd(), 'reports', `${projectName}-junit-report.xml`);
    const reportExists = fs.existsSync(reportPath);

    // Detox crashed without producing a report — treat as genuine failure regardless of other options.
    if (detoxFailed && !reportExists) {
        console.warn(
            `Report not found at ${reportPath} and Detox already failed — treating as failure.`,
        );

        return true;
    }

    // Nothing to process — report either passed cleanly or doesn't exist for a benign reason.
    if (!grep && quarantinedActions.length === 0) return false;

    if (!reportExists) {
        console.warn(`Report not found at ${reportPath}`);

        return false;
    }

    try {
        const xml = fs.readFileSync(reportPath, 'utf8');
        const result = await new xml2js.Parser().parseStringPromise(xml);

        if (!result.testsuites?.testsuite) {
            console.log(`No test suites found in report for ${projectName}.`);

            return false;
        }

        const regex = grep ? new RegExp(grep) : null;

        result.testsuites.testsuite.forEach((suite: any) => {
            if (!suite.testcase) return;

            if (regex) {
                filterSuiteByGrep(suite, regex);
            }

            if (quarantinedActions.length > 0) {
                applySuiteQuarantine(suite, projectName, quarantinedActions);
            }
        });

        recomputeAggregates(result.testsuites);

        const newXml = new xml2js.Builder().buildObject(result);
        fs.writeFileSync(reportPath, newXml);
        console.log(`Processed and updated JUnit report for ${projectName}`);

        return hasAnyFailures(result.testsuites);
    } catch (error) {
        console.error(`Failed to process JUnit report for ${projectName}:`, error);

        return true; // Treat parse errors as failures to be safe
    }
};
