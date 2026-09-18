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
                invocations: 3,
                retryReasons: ['Error: first attempt', 'Error: second attempt'],
            },
            {
                fullName: 'Send flow shows fee @T3T1',
                status: 'passed',
                invocations: 1,
                retryReasons: [],
            },
        ];

        expect(readTestAttempts(createTempFile(JSON.stringify(attempts)))).toEqual(
            new Map(attempts.map(attempt => [attempt.fullName, attempt])),
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
