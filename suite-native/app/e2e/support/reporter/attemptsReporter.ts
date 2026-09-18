import type { AggregatedResult, Reporter } from '@jest/reporters';
import * as fs from 'fs';
import * as path from 'path';

import type { TestAttempts } from '../../trezorDetoxRunner/testAttempts';

type AttemptsReporterOptions = {
    outputFile: string;
};

// Jest leaves `invocations` and `retryReasons` out of both its JUnit and JSON outputs, but the
// Detox runner needs them to report every retry to Currents as a separate attempt.
class AttemptsReporter implements Pick<Reporter, 'onRunComplete'> {
    private readonly outputFile: string;

    constructor(_globalConfig: unknown, options: AttemptsReporterOptions) {
        this.outputFile = options.outputFile;
    }

    onRunComplete(_testContexts: unknown, results: AggregatedResult): void {
        const attempts: TestAttempts[] = results.testResults.flatMap(testFile =>
            testFile.testResults.map(test => ({
                fullName: test.fullName,
                status: test.status,
                invocations: test.invocations ?? 1,
                retryReasons: test.retryReasons ?? [],
            })),
        );

        fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
        fs.writeFileSync(this.outputFile, JSON.stringify(attempts));
    }
}

module.exports = AttemptsReporter;
