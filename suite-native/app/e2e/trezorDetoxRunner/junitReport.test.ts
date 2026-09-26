import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { processJUnitReport } from './junitReport';
import type { Action } from './quarantine';

jest.mock('@trezor/e2e-utils', () => ({ getAllQuarantineActions: jest.fn() }));

const projectName = 'T3T1';
const suiteName = 'Device settings T3T1 [@androidOnly @T3T1]';
const testName = 'Device settings T3T1 [@androidOnly @T3T1] Wipe device';
const originalWorkingDirectory = process.cwd();

const quarantineAction: Action = {
    actionId: 'quarantine-action-id',
    name: 'Quarantine Wipe device',
    description: 'Test quarantine action',
    action: [{ op: 'quarantine' }],
    matcher: {
        op: 'AND',
        cond: [{ type: 'titlePath', op: 'incAll', value: [suiteName, testName] }],
    },
    status: 'active',
    createdAt: '2026-09-15T13:41:41.277Z',
};

const junitReport = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="1" failures="1" errors="0" skipped="0">
    <testsuite name="${suiteName}" tests="1" failures="1" errors="0" skipped="0">
        <testcase name="${testName}" time="1">
            <failure message="Device wipe failed">Device wipe failed</failure>
        </testcase>
    </testsuite>
</testsuites>`;

describe(processJUnitReport.name, () => {
    let temporaryWorkingDirectory: string;

    beforeEach(() => {
        temporaryWorkingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'junit-report-'));
        fs.mkdirSync(path.join(temporaryWorkingDirectory, 'reports'));
        fs.writeFileSync(
            path.join(temporaryWorkingDirectory, 'reports', `${projectName}-junit-report.xml`),
            junitReport,
        );
        process.chdir(temporaryWorkingDirectory);
    });

    afterEach(() => {
        process.chdir(originalWorkingDirectory);
        fs.rmSync(temporaryWorkingDirectory, { recursive: true, force: true });
    });

    it('keeps the original failure in the report uploaded to Currents', async () => {
        const hasRemainingFailures = await processJUnitReport(projectName, true, undefined, [
            quarantineAction,
        ]);

        const processedReport = fs.readFileSync(
            path.join('reports', `${projectName}-junit-report.xml`),
            'utf8',
        );

        expect(hasRemainingFailures).toBe(false);
        expect(processedReport).toContain('<failure');
        expect(processedReport).toContain('Device wipe failed');
        expect(processedReport).not.toContain('<skipped');
    });
});
