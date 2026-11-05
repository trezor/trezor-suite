/* eslint-disable no-console */
import type { Reporter, Test } from '@jest/reporters';
import * as path from 'path';

// Only the path of a test file is needed, which keeps the reporter independent of the Jest context.
type TestFile = Pick<Test, 'path'>;

type TestFileTiming = {
    startedAt: number;
    firstTestStartedAt?: number;
};

const LOG_PREFIX = '[E2E timing]';

const formatSeconds = (milliseconds: number) => `${Math.round(milliseconds / 1000)} s`;

const getProjectStartedAt = () => {
    const projectStartedAt = Number(process.env.TDR_PROJECT_STARTED_AT);

    return Number.isFinite(projectStartedAt) && projectStartedAt > 0 ? projectStartedAt : undefined;
};

/**
 * Logs where the time of a Detox run goes besides the tests themselves: starting Detox and Jest
 * before the first test file, preparing the device and the app before the first test of every
 * file, and files in which no test runs at all.
 */
export class TimingReporter implements Pick<
    Reporter,
    'onTestFileStart' | 'onTestCaseStart' | 'onTestFileResult' | 'onRunComplete'
> {
    private readonly projectStartedAt = getProjectStartedAt();
    private readonly testFileTimings = new Map<string, TestFileTiming>();
    private timeBeforeFirstTests = 0;
    private filesWithoutTestsCount = 0;
    private timeInFilesWithoutTests = 0;

    onTestFileStart(test: TestFile): void {
        const startedAt = Date.now();

        if (this.testFileTimings.size === 0 && this.projectStartedAt !== undefined) {
            console.log(
                `${LOG_PREFIX} Detox and Jest started the first test file after ${formatSeconds(startedAt - this.projectStartedAt)}.`,
            );
        }

        this.testFileTimings.set(test.path, { startedAt });
    }

    onTestCaseStart(test: TestFile): void {
        const timing = this.testFileTimings.get(test.path);

        if (timing && timing.firstTestStartedAt === undefined) {
            timing.firstTestStartedAt = Date.now();
        }
    }

    onTestFileResult(test: TestFile): void {
        const timing = this.testFileTimings.get(test.path);

        if (!timing) return;

        const fileName = path.basename(test.path);
        const fileDuration = Date.now() - timing.startedAt;

        if (timing.firstTestStartedAt === undefined) {
            this.filesWithoutTestsCount += 1;
            this.timeInFilesWithoutTests += fileDuration;
            console.log(`${LOG_PREFIX} ${fileName}: ${formatSeconds(fileDuration)}, no test ran.`);

            return;
        }

        const timeBeforeFirstTest = timing.firstTestStartedAt - timing.startedAt;
        this.timeBeforeFirstTests += timeBeforeFirstTest;
        console.log(
            `${LOG_PREFIX} ${fileName}: ${formatSeconds(fileDuration)}, the first test started after ${formatSeconds(timeBeforeFirstTest)}.`,
        );
    }

    onRunComplete(): void {
        const filesWithTestsCount = this.testFileTimings.size - this.filesWithoutTestsCount;

        console.log(
            `${LOG_PREFIX} Summary: ${formatSeconds(this.timeBeforeFirstTests)} before the first test of a file (files with tests: ${filesWithTestsCount}), ${formatSeconds(this.timeInFilesWithoutTests)} in files where no test ran (files: ${this.filesWithoutTestsCount}).`,
        );
    }
}
