import type { TestCaseResult } from '@jest/reporters';
import * as fs from 'fs';
import * as path from 'path';

export type TestAttempts = Pick<TestCaseResult, 'fullName' | 'status'> & {
    testFilePath: string;
    invocations: number;
    retryReasons: string[];
};

// The JUnit report and the Detox artifact directories identify a test by its full name only, so
// the attempts of tests sharing one cannot be told apart and are better left out than misapplied.
const dropAmbiguousNames = (attempts: TestAttempts[]): TestAttempts[] => {
    const filesByName = new Map<string, string[]>();
    attempts.forEach(({ fullName, testFilePath }) => {
        filesByName.set(fullName, [...(filesByName.get(fullName) ?? []), testFilePath]);
    });

    filesByName.forEach((files, fullName) => {
        if (files.length > 1) {
            console.warn(
                `Test "${fullName}" is not unique (${[...new Set(files)].join(', ')}), retries and artifacts of these tests will be omitted.`,
            );
        }
    });

    return attempts.filter(({ fullName }) => filesByName.get(fullName)?.length === 1);
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

        return new Map(dropAmbiguousNames(attempts).map(attempt => [attempt.fullName, attempt]));
    } catch (error) {
        console.error(`Failed to read test attempts at ${filePath}:`, error);

        return new Map();
    }
};
