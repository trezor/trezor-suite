import { TimingReporter } from './timingReporter';

const mockTest = (testPath: string) => ({ path: testPath });

describe('TimingReporter', () => {
    const projectStartedAt = new Date('2026-11-05T01:00:00Z').getTime();
    let consoleLogSpy: jest.SpyInstance;

    const advanceSeconds = (seconds: number) => {
        jest.setSystemTime(Date.now() + seconds * 1000);
    };

    beforeEach(() => {
        jest.useFakeTimers({ now: projectStartedAt });
        process.env.TDR_PROJECT_STARTED_AT = String(projectStartedAt);
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        delete process.env.TDR_PROJECT_STARTED_AT;
        consoleLogSpy.mockRestore();
    });

    it('logs the time before the first test of each file and in files where no test ran', () => {
        const reporter = new TimingReporter();
        const settingsTest = mockTest('/app/e2e/tests/appSettings.test.ts');
        const sendTest = mockTest('/app/e2e/tests/send.test.ts');

        advanceSeconds(360);
        reporter.onTestFileStart(settingsTest);
        advanceSeconds(20);
        reporter.onTestCaseStart(settingsTest);
        advanceSeconds(60);
        reporter.onTestCaseStart(settingsTest);
        advanceSeconds(60);
        reporter.onTestFileResult(settingsTest);
        reporter.onTestFileStart(sendTest);
        advanceSeconds(90);
        reporter.onTestFileResult(sendTest);
        reporter.onRunComplete();

        expect(consoleLogSpy.mock.calls.map(([message]) => message)).toEqual([
            '[E2E timing] Detox and Jest started the first test file after 360 s.',
            '[E2E timing] appSettings.test.ts: 140 s, the first test started after 20 s.',
            '[E2E timing] send.test.ts: 90 s, no test ran.',
            '[E2E timing] Summary: 20 s before the first test of a file (files with tests: 1), 90 s in files where no test ran (files: 1).',
        ]);
    });

    it('does not log the start-up time without the project start time', () => {
        delete process.env.TDR_PROJECT_STARTED_AT;
        const reporter = new TimingReporter();

        reporter.onTestFileStart(mockTest('/app/e2e/tests/send.test.ts'));

        expect(consoleLogSpy).not.toHaveBeenCalled();
    });
});
