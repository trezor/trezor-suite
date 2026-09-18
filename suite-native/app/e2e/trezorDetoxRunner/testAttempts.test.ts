import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { TestAttempts } from './testAttempts';
import { readTestAttempts } from './testAttempts';

const createTempFile = (content: string): string => {
    const filePath = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), 'attempts-')),
        'attempts.json',
    );
    fs.writeFileSync(filePath, content);

    return filePath;
};

describe('readTestAttempts', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('maps the reported attempts by the full test name', () => {
        const attempts: TestAttempts[] = [
            {
                fullName: 'Send flow sends BTC @T3T1',
                status: 'failed',
                testFilePath: 'e2e/tests/sendFlow.test.ts',
                invocations: 3,
                retryReasons: ['Error: first attempt', 'Error: second attempt'],
            },
            {
                fullName: 'Send flow shows fee @T3T1',
                status: 'passed',
                testFilePath: 'e2e/tests/sendFlow.test.ts',
                invocations: 1,
                retryReasons: [],
            },
        ];

        expect(readTestAttempts(createTempFile(JSON.stringify(attempts)))).toEqual(
            new Map(attempts.map(attempt => [attempt.fullName, attempt])),
        );
    });

    it('leaves out the tests whose full name is not unique', () => {
        const unique: TestAttempts = {
            fullName: 'Send flow shows fee @T3T1',
            status: 'passed',
            testFilePath: 'e2e/tests/sendFlow.test.ts',
            invocations: 1,
            retryReasons: [],
        };
        const attempts: TestAttempts[] = [
            { ...unique, fullName: 'Send flow sends BTC @T3T1' },
            unique,
            {
                ...unique,
                fullName: 'Send flow sends BTC @T3T1',
                testFilePath: 'e2e/tests/sendFlowLegacy.test.ts',
            },
        ];

        expect(readTestAttempts(createTempFile(JSON.stringify(attempts)))).toEqual(
            new Map([[unique.fullName, unique]]),
        );
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining(
                '"Send flow sends BTC @T3T1" is not unique (e2e/tests/sendFlow.test.ts, e2e/tests/sendFlowLegacy.test.ts)',
            ),
        );
    });

    it('returns an empty map when the file is missing', () => {
        expect(readTestAttempts(path.join(os.tmpdir(), 'missing-attempts.json'))).toEqual(
            new Map(),
        );
    });

    it('returns an empty map when the file is not valid JSON', () => {
        expect(readTestAttempts(createTempFile('not json'))).toEqual(new Map());
    });
});
