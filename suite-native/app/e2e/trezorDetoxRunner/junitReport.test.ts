import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import xml2js from 'xml2js';

import { processJUnitReport } from './junitReport';
import type { Action } from './quarantine';
import type { TestAttempts } from './testAttempts';

// The quarantine module pulls in the whole e2e-utils package, whose websocket mocks do not load in
// the jsdom test environment.
jest.mock('@trezor/e2e-utils', () => ({ getAllQuarantineActions: jest.fn() }));

const PROJECT_NAME = 'T3T1';
const SUITE_NAME = 'Send flow';
const TEST_NAME = 'Send flow sends BTC @T3T1';
const DETOX_RUN_DIR = 'android.emu.release.2026-09-18 10-00-00Z';

type TestCaseFixture = {
    name: string;
    failures?: string[];
};

const buildReport = (testCases: TestCaseFixture[]): string => {
    const failures = testCases.filter(testCase => testCase.failures !== undefined).length;
    const testCasesXml = testCases
        .map(
            testCase =>
                `<testcase classname="${testCase.name}" name="${testCase.name}" time="3">${(
                    testCase.failures ?? []
                )
                    .map(failure => `<failure>${failure}</failure>`)
                    .join('')}</testcase>`,
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="${PROJECT_NAME}" tests="${testCases.length}" failures="${failures}" errors="0" time="9">
  <testsuite name="${SUITE_NAME}" errors="0" failures="${failures}" skipped="0" timestamp="2026-09-18T10:00:00" time="9" tests="${testCases.length}">
${testCasesXml}
  </testsuite>
</testsuites>`;
};

const quarantineAction: Action = {
    actionId: 'action-1',
    name: 'Quarantine sends BTC',
    description: '',
    action: [{ op: 'quarantine' }],
    matcher: { op: 'AND', cond: [{ type: 'title', op: 'eq', value: TEST_NAME }] },
    status: 'active',
    createdAt: '2026-09-18T00:00:00Z',
};

type ParsedProperty = { $: { name: string; value: string } };

const getPropertyPairs = (node: { properties?: { property?: ParsedProperty[] }[] }): string[][] =>
    (node.properties?.[0]?.property ?? []).map(property => [property.$.name, property.$.value]);

describe('processJUnitReport', () => {
    let workDir: string;
    let reportPath: string;
    let artifactsRootDir: string;

    const writeReport = (testCases: TestCaseFixture[]): void => {
        fs.writeFileSync(reportPath, buildReport(testCases));
    };

    const readReport = () =>
        new xml2js.Parser().parseStringPromise(fs.readFileSync(reportPath, 'utf8'));

    const createArtifact = (testDirName: string, fileName: string): string => {
        const filePath = path.join(artifactsRootDir, testDirName, fileName);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, '');

        return filePath;
    };

    beforeEach(() => {
        workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'junit-report-'));
        reportPath = path.join(workDir, `${PROJECT_NAME}-junit-report.xml`);
        artifactsRootDir = path.join(workDir, 'artifacts', DETOX_RUN_DIR);
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reports every retry of a failed test as a separate attempt with its own artifacts', async () => {
        writeReport([{ name: TEST_NAME, failures: ['Error: third attempt'] }]);
        const attempts: TestAttempts = {
            fullName: TEST_NAME,
            status: 'failed',
            invocations: 3,
            retryReasons: ['Error: first [31mattempt[39m', 'Error: second attempt'],
        };
        const firstVideo = createArtifact(`✗ ${TEST_NAME}`, 'test.mp4');
        const secondVideo = createArtifact(`✗ ${TEST_NAME} (2)`, 'test.mp4');
        const thirdVideo = createArtifact(`✗ ${TEST_NAME} (3)`, 'test.mp4');
        const thirdScreenshot = createArtifact(`✗ ${TEST_NAME} (3)`, 'testDone.png');

        const hasRemainingFailures = await processJUnitReport({
            projectName: PROJECT_NAME,
            reportPath,
            detoxFailed: true,
            quarantinedActions: [],
            testAttempts: new Map([[TEST_NAME, attempts]]),
            artifactsRootDir,
            instanceAttachments: ['artifacts/trezor-user-env.T3T1/debugging.log'],
        });

        expect(hasRemainingFailures).toBe(true);
        const report = await readReport();
        const [suite] = report.testsuites.testsuite;
        const [testCase] = suite.testcase;
        expect(testCase.failure).toEqual([
            'Error: first attempt',
            'Error: second attempt',
            'Error: third attempt',
        ]);
        expect(getPropertyPairs(testCase)).toEqual([
            ['currents.artifact.attempt.0.path', firstVideo],
            ['currents.artifact.attempt.0.type', 'video'],
            ['currents.artifact.attempt.0.contentType', 'video/mp4'],
            ['currents.artifact.attempt.0.name', 'attempt 1 test.mp4'],
            ['currents.artifact.attempt.1.path', secondVideo],
            ['currents.artifact.attempt.1.type', 'video'],
            ['currents.artifact.attempt.1.contentType', 'video/mp4'],
            ['currents.artifact.attempt.1.name', 'attempt 2 test.mp4'],
            ['currents.artifact.attempt.2.path', thirdVideo],
            ['currents.artifact.attempt.2.type', 'video'],
            ['currents.artifact.attempt.2.contentType', 'video/mp4'],
            ['currents.artifact.attempt.2.name', 'attempt 3 test.mp4'],
            ['currents.artifact.attempt.2.path', thirdScreenshot],
            ['currents.artifact.attempt.2.type', 'screenshot'],
            ['currents.artifact.attempt.2.contentType', 'image/png'],
            ['currents.artifact.attempt.2.name', 'attempt 3 testDone.png'],
        ]);
        expect(getPropertyPairs(suite)).toEqual([
            ['currents.artifact.instance.path', 'artifacts/trezor-user-env.T3T1/debugging.log'],
            ['currents.artifact.instance.type', 'attachment'],
            ['currents.artifact.instance.contentType', 'text/plain'],
            ['currents.artifact.instance.name', 'debugging.log'],
        ]);
    });

    it('keeps one failure per attempt when an attempt raised several errors', async () => {
        writeReport([{ name: TEST_NAME, failures: ['Error: second attempt', 'Error: afterEach'] }]);
        const attempts: TestAttempts = {
            fullName: TEST_NAME,
            status: 'failed',
            invocations: 2,
            retryReasons: ['Error: first attempt', 'Error: afterEach'],
        };
        const secondVideo = createArtifact(`✗ ${TEST_NAME} (2)`, 'test.mp4');

        await processJUnitReport({
            projectName: PROJECT_NAME,
            reportPath,
            detoxFailed: true,
            quarantinedActions: [],
            testAttempts: new Map([[TEST_NAME, attempts]]),
            artifactsRootDir,
            instanceAttachments: [],
        });

        const report = await readReport();
        const [testCase] = report.testsuites.testsuite[0].testcase;
        expect(testCase.failure).toEqual([
            'Error: first attempt\n\nError: afterEach',
            'Error: second attempt\n\nError: afterEach',
        ]);
        expect(getPropertyPairs(testCase)).toEqual([
            ['currents.artifact.attempt.1.path', secondVideo],
            ['currents.artifact.attempt.1.type', 'video'],
            ['currents.artifact.attempt.1.contentType', 'video/mp4'],
            ['currents.artifact.attempt.1.name', 'attempt 2 test.mp4'],
        ]);
    });

    it('fills in the retries whose reason Jest did not record', async () => {
        writeReport([{ name: TEST_NAME, failures: ['Error: third attempt'] }]);
        const attempts: TestAttempts = {
            fullName: TEST_NAME,
            status: 'failed',
            invocations: 3,
            retryReasons: [],
        };

        await processJUnitReport({
            projectName: PROJECT_NAME,
            reportPath,
            detoxFailed: true,
            quarantinedActions: [],
            testAttempts: new Map([[TEST_NAME, attempts]]),
            artifactsRootDir,
            instanceAttachments: [],
        });

        const report = await readReport();
        const [testCase] = report.testsuites.testsuite[0].testcase;
        expect(testCase.failure).toEqual([
            expect.stringContaining('did not record'),
            expect.stringContaining('did not record'),
            'Error: third attempt',
        ]);
    });

    it('keeps a flaky test passed and attaches the artifacts of all its attempts', async () => {
        writeReport([{ name: TEST_NAME }]);
        const attempts: TestAttempts = {
            fullName: TEST_NAME,
            status: 'passed',
            invocations: 2,
            retryReasons: ['Error: first attempt'],
        };
        const failedVideo = createArtifact(`✗ ${TEST_NAME}`, 'test.mp4');
        const passedVideo = createArtifact(`✓ ${TEST_NAME} (2)`, 'test.mp4');

        const hasRemainingFailures = await processJUnitReport({
            projectName: PROJECT_NAME,
            reportPath,
            detoxFailed: false,
            quarantinedActions: [],
            testAttempts: new Map([[TEST_NAME, attempts]]),
            artifactsRootDir,
            instanceAttachments: ['artifacts/trezor-user-env.T3T1/debugging.log'],
        });

        expect(hasRemainingFailures).toBe(false);
        const report = await readReport();
        const [suite] = report.testsuites.testsuite;
        const [testCase] = suite.testcase;
        expect(testCase.failure).toBeUndefined();
        expect(getPropertyPairs(testCase)).toEqual([
            ['currents.artifact.attempt.0.path', failedVideo],
            ['currents.artifact.attempt.0.type', 'video'],
            ['currents.artifact.attempt.0.contentType', 'video/mp4'],
            ['currents.artifact.attempt.0.name', 'attempt 1 test.mp4'],
            ['currents.artifact.attempt.1.path', passedVideo],
            ['currents.artifact.attempt.1.type', 'video'],
            ['currents.artifact.attempt.1.contentType', 'video/mp4'],
            ['currents.artifact.attempt.1.name', 'attempt 2 test.mp4'],
        ]);
        expect(suite.properties).toBeUndefined();
    });

    it('drops the failures and artifacts of a quarantined test', async () => {
        writeReport([{ name: TEST_NAME, failures: ['Error: second attempt'] }]);
        const attempts: TestAttempts = {
            fullName: TEST_NAME,
            status: 'failed',
            invocations: 2,
            retryReasons: ['Error: first attempt'],
        };
        createArtifact(`✗ ${TEST_NAME}`, 'test.mp4');

        const hasRemainingFailures = await processJUnitReport({
            projectName: PROJECT_NAME,
            reportPath,
            detoxFailed: true,
            quarantinedActions: [quarantineAction],
            testAttempts: new Map([[TEST_NAME, attempts]]),
            artifactsRootDir,
            instanceAttachments: ['artifacts/trezor-user-env.T3T1/debugging.log'],
        });

        expect(hasRemainingFailures).toBe(false);
        const report = await readReport();
        const [suite] = report.testsuites.testsuite;
        const [testCase] = suite.testcase;
        expect(testCase.failure).toBeUndefined();
        expect(testCase.skipped).toBeDefined();
        expect(testCase.properties).toBeUndefined();
        expect(suite.$.failures).toBe('0');
        expect(suite.properties).toBeUndefined();
    });

    it('treats a missing report as a failure when Detox failed', async () => {
        const hasRemainingFailures = await processJUnitReport({
            projectName: PROJECT_NAME,
            reportPath,
            detoxFailed: true,
            quarantinedActions: [],
            testAttempts: new Map(),
            instanceAttachments: [],
        });

        expect(hasRemainingFailures).toBe(true);
    });
});
