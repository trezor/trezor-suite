import type { Test, TestContext } from '@jest/reporters';
import type { AggregatedResult, TestResult } from '@jest/test-result';
import * as fs from 'fs';
import * as path from 'path';

import { GitHubReporterBase, LoggingFunctions } from '@trezor/e2e-utils';

const METADATA_DIR = path.join(process.cwd(), '.metadata');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function readMetadataForTest(name: string): Record<string, unknown> {
    const safeName = Buffer.from(name).toString('base64');
    const filePath = path.join(METADATA_DIR, `${safeName}.json`);
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');

        return JSON.parse(raw);
    } catch {
        console.warn(`No metadata found for test: ${name}`);
        console.warn(`Expected file at: ${filePath}`);

        return {};
    }
}

class GitHubReporter extends GitHubReporterBase implements LoggingFunctions {
    onRunStart(
        results: AggregatedResult,
        options: { estimatedTime: number },
    ): void | Promise<void> {
        this.log('GitHub reporter started.');
    }

    onTestResult(
        test: Test,
        testResult: TestResult,
        aggregatedResult: AggregatedResult,
    ): void | Promise<void> {
        this.log(`Processing test end for "${test.path}"`);
    }

    onRunComplete(contexts: Set<TestContext>, results: AggregatedResult): void | Promise<void> {
        this.log('Run complete');
    }
}

module.exports = GitHubReporter;
