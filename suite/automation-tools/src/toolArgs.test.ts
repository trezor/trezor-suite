import {
    readOptionalBoolean,
    readOptionalNumber,
    readOptionalObject,
    readOptionalString,
    readRequiredObject,
    readRequiredString,
} from './toolArgs';

describe('toolArgs', () => {
    it('reads a required string and rejects anything else', () => {
        expect(readRequiredString({ path: 'router' }, 'path', 'suite.state')).toBe('router');
        expect(() => readRequiredString({}, 'path', 'suite.state')).toThrow(
            'suite.state: "path" must be a string',
        );
        expect(() => readRequiredString({ path: 1 }, 'path', 'suite.state')).toThrow();
    });

    it('treats an absent optional argument as undefined but checks a present one', () => {
        expect(readOptionalString({}, 'prefix', 'suite.testIds')).toBeUndefined();
        expect(readOptionalString({ prefix: '@suite' }, 'prefix', 'suite.testIds')).toBe('@suite');
        expect(() => readOptionalString({ prefix: 1 }, 'prefix', 'suite.testIds')).toThrow();

        expect(readOptionalNumber({}, 'limit', 'suite.testIds')).toBeUndefined();
        expect(readOptionalNumber({ limit: 5 }, 'limit', 'suite.testIds')).toBe(5);
        expect(() => readOptionalNumber({ limit: NaN }, 'limit', 'suite.testIds')).toThrow(
            'suite.testIds: "limit" must be a finite number',
        );

        expect(readOptionalBoolean({}, 'preserveParams', 'suite.goto')).toBeUndefined();
        expect(readOptionalBoolean({ preserveParams: true }, 'preserveParams', 'suite.goto')).toBe(
            true,
        );
        expect(() =>
            readOptionalBoolean({ preserveParams: 1 }, 'preserveParams', 'suite.goto'),
        ).toThrow();
    });

    it('accepts plain objects only', () => {
        const storage = { accounts: [] };

        expect(readRequiredObject({ storage }, 'storage', 'suite.seed')).toBe(storage);
        expect(() => readRequiredObject({ storage: [] }, 'storage', 'suite.seed')).toThrow(
            'suite.seed: "storage" must be an object',
        );
        expect(() => readRequiredObject({ storage: null }, 'storage', 'suite.seed')).toThrow();
        expect(readOptionalObject({}, 'selectedDevice', 'suite.seed')).toBeUndefined();
    });
});
