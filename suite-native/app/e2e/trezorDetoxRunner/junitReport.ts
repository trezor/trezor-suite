/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import { stripVTControlCharacters } from 'util';
import xml2js from 'xml2js';

import type { CurrentsArtifact } from './detoxArtifacts';
import { getAttemptArtifacts } from './detoxArtifacts';
import type { Action } from './quarantine';
import { getTitlePath, isQuarantined } from './quarantine';
import type { TestAttempts } from './testAttempts';

type JUnitProperty = { $: { name: string; value: string } };
type JUnitProperties = { property?: JUnitProperty[] };

type JUnitTestCase = {
    $: { name: string };
    failure?: string[];
    error?: unknown[];
    skipped?: unknown[];
    properties?: JUnitProperties[];
};

type JUnitTestSuite = {
    $?: { name?: string; failures?: string; errors?: string; skipped?: string };
    testcase?: JUnitTestCase[];
    properties?: JUnitProperties[];
};

/** Remove skipped testcases from a suite that don't match the grep regex. */
const filterSuiteByGrep = (suite: any, regex: RegExp): void => {
    suite.testcase = suite.testcase.filter((tc: any) => {
        const isSkipped = tc.skipped !== undefined;
        if (!isSkipped) return true;

        return regex.test(tc.$.name);
    });
};

const MISSING_RETRY_REASON =
    'Jest did not record the reason of this failed attempt (jest.retryTimes without logErrorsBeforeRetry).';

// Jest records one retry reason per error rather than per attempt, so the reasons can only be
// attributed to the individual retries when their counts match.
const getRetryFailures = ({ invocations, retryReasons }: TestAttempts): string[] => {
    const retries = Math.max(invocations - 1, 0);
    const reasons = retryReasons.map(reason => stripVTControlCharacters(reason));
    if (reasons.length === retries) return reasons;

    return Array.from({ length: retries }, () => reasons.join('\n\n') || MISSING_RETRY_REASON);
};

/**
 * The Currents JUnit converter creates one attempt per <failure> element, while jest-junit writes
 * one per error (a failing test plus its failing afterEach hook make two). Every failed test gets
 * exactly one <failure> per invocation to keep the artifacts of the individual attempts apart.
 */
const setOneFailurePerAttempt = (
    suite: JUnitTestSuite,
    testAttempts: Map<string, TestAttempts>,
): void => {
    suite.testcase?.forEach(testCase => {
        if (testCase.failure === undefined) return;

        const attempts = testAttempts.get(testCase.$.name);
        const retryFailures = attempts ? getRetryFailures(attempts) : [];

        testCase.failure = [...retryFailures, testCase.failure.join('\n\n')];
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

const toArtifactProperties = (
    propertyPrefix: string,
    artifact: CurrentsArtifact,
): JUnitProperty[] => {
    const toProperty = (key: keyof CurrentsArtifact): JUnitProperty => ({
        $: { name: `${propertyPrefix}.${key}`, value: artifact[key] },
    });

    return [toProperty('path'), toProperty('type'), toProperty('contentType'), toProperty('name')];
};

const appendProperties = (
    node: { properties?: JUnitProperties[] },
    properties: JUnitProperty[],
): void => {
    if (properties.length === 0) return;

    const existingProperties = node.properties?.[0]?.property ?? [];
    node.properties = [{ property: [...existingProperties, ...properties] }];
};

// Every attempt before the last one failed, otherwise Jest would not have retried the test.
const getAttemptStatus = (attempts: TestAttempts, invocation: number): TestAttempts['status'] =>
    invocation < attempts.invocations ? 'failed' : attempts.status;

type AddAttemptArtifactsParams = {
    suite: JUnitTestSuite;
    testAttempts: Map<string, TestAttempts>;
    artifactsRootDir: string;
};

const addAttemptArtifacts = ({
    suite,
    testAttempts,
    artifactsRootDir,
}: AddAttemptArtifactsParams): void => {
    suite.testcase?.forEach(testCase => {
        const attempts = testAttempts.get(testCase.$.name);
        // The converter attaches only the first attempt's artifacts to a skipped test, which would
        // show a quarantined test with the video of its first failure but not of its final one.
        if (!attempts || testCase.skipped !== undefined) return;

        const invocations = Array.from({ length: attempts.invocations }, (_, index) => index + 1);
        const properties = invocations.flatMap(invocation =>
            getAttemptArtifacts({
                rootDir: artifactsRootDir,
                fullName: attempts.fullName,
                status: getAttemptStatus(attempts, invocation),
                invocation,
            }).flatMap(artifact =>
                toArtifactProperties(`currents.artifact.attempt.${invocation - 1}`, artifact),
            ),
        );

        appendProperties(testCase, properties);
    });
};

const addInstanceAttachments = (suite: JUnitTestSuite, attachments: string[]): void => {
    const properties = attachments.flatMap(filePath =>
        toArtifactProperties('currents.artifact.instance', {
            path: filePath,
            type: 'attachment',
            contentType: 'text/plain',
            name: path.basename(filePath),
        }),
    );

    appendProperties(suite, properties);
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

const hasSuiteFailures = (suite: JUnitTestSuite): boolean =>
    parseInt(suite.$?.failures ?? '0', 10) > 0 || parseInt(suite.$?.errors ?? '0', 10) > 0;

const hasAnyFailures = (testsuites: any): boolean =>
    testsuites.testsuite.some((suite: JUnitTestSuite) => hasSuiteFailures(suite));

export const getJUnitReportPath = (projectName: string): string =>
    path.resolve(process.cwd(), 'reports', `${projectName}-junit-report.xml`);

type ProcessJUnitReportParams = {
    projectName: string;
    detoxFailed: boolean;
    grep?: string;
    quarantinedActions: Action[];
    testAttempts: Map<string, TestAttempts>;
    /** Detox artifacts directory of this run, relative to the working directory like the report paths. */
    artifactsRootDir?: string;
    /** Files attached to every suite which still fails after quarantine. */
    instanceAttachments: string[];
};

/**
 * Process the JUnit XML report for a project.
 * - Filters out skipped tests that don't match grep.
 * - Reshapes the failures into one <failure> per attempt so Currents shows each attempt separately.
 * - When quarantinedActions are provided, converts failing testcases that are
 *   quarantined into skipped ones and adjusts suite-level counters.
 * - Attaches the Detox artifacts of every attempt and the instance attachments as Currents
 *   artifact properties.
 *
 * Returns true when there are still genuine (non-quarantined) failures remaining,
 * false when every failure was quarantined (or there were no failures).
 */
export const processJUnitReport = async ({
    projectName,
    detoxFailed,
    grep,
    quarantinedActions,
    testAttempts,
    artifactsRootDir,
    instanceAttachments,
}: ProcessJUnitReportParams): Promise<boolean> => {
    const reportPath = getJUnitReportPath(projectName);
    const reportExists = fs.existsSync(reportPath);

    // Detox crashed without producing a report — treat as genuine failure regardless of other options.
    if (detoxFailed && !reportExists) {
        console.warn(
            `Report not found at ${reportPath} and Detox already failed — treating as failure.`,
        );

        return true;
    }

    if (!reportExists) {
        console.warn(`Report not found at ${reportPath}`);

        return false;
    }

    try {
        const xml = fs.readFileSync(reportPath, 'utf8');
        const result = await new xml2js.Parser().parseStringPromise(xml);

        if (!result.testsuites?.testsuite) {
            console.log(`No test suites found in report for ${projectName}.`);

            return detoxFailed;
        }

        const regex = grep ? new RegExp(grep) : null;

        result.testsuites.testsuite.forEach((suite: any) => {
            if (!suite.testcase) return;

            if (regex) {
                filterSuiteByGrep(suite, regex);
            }

            setOneFailurePerAttempt(suite, testAttempts);

            if (quarantinedActions.length > 0) {
                applySuiteQuarantine(suite, projectName, quarantinedActions);
            }

            if (artifactsRootDir) {
                addAttemptArtifacts({ suite, testAttempts, artifactsRootDir });
            }

            if (hasSuiteFailures(suite)) {
                addInstanceAttachments(suite, instanceAttachments);
            }
        });

        recomputeAggregates(result.testsuites);

        const newXml = new xml2js.Builder().buildObject(result);
        fs.writeFileSync(reportPath, newXml);
        console.log(`Processed and updated JUnit report for ${projectName}`);

        if (!grep && quarantinedActions.length === 0) return detoxFailed;

        return hasAnyFailures(result.testsuites);
    } catch (error) {
        console.error(`Failed to process JUnit report for ${projectName}:`, error);

        return true; // Treat parse errors as failures to be safe
    }
};
