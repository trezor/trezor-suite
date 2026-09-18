import type { TestCaseResult } from '@jest/reporters';
import * as fs from 'fs';
import * as path from 'path';

export type TestAttempts = Pick<TestCaseResult, 'fullName' | 'status'> & {
    invocations: number;
    retryReasons: string[];
};

export const getTestAttemptsPath = (projectName: string): string =>
    path.resolve(process.cwd(), 'reports', `${projectName}-attempts.json`);

export const readTestAttempts = (filePath: string): Map<string, TestAttempts> => {
    if (!fs.existsSync(filePath)) {
        console.warn(
            `Test attempts not found at ${filePath}, retries and artifacts will be omitted.`,
        );

        return new Map();
    }

    try {
        const attempts = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TestAttempts[];

        return new Map(attempts.map(attempt => [attempt.fullName, attempt]));
    } catch (error) {
        console.error(`Failed to read test attempts at ${filePath}:`, error);

        return new Map();
    }
};
