import { datetimeToLocktime } from './bitcoinUtils';

describe(datetimeToLocktime.name, () => {
    it('valid timestamp', () => {
        expect(datetimeToLocktime('08/07/2025 12:00:00')).toBe(1751976000);
    });

    it('too low datetime - uses block count instead', () => {
        expect(datetimeToLocktime('05/11/1985 00:53:19')).toBe(undefined);
    });

    it('minimum possible datetime', () => {
        expect(datetimeToLocktime('05/11/1985 00:53:20')).toBe(500000000);
    });

    it('maximum possible datetime', () => {
        expect(datetimeToLocktime('07/02/2106 06:28:15')).toBe(4294967295);
    });

    it('too high - does not fit in 4 bytes', () => {
        expect(datetimeToLocktime('07/02/2106 06:28:16')).toBe(undefined);
    });

    it('invalid input', () => {
        expect(datetimeToLocktime('invalid date')).toBeUndefined();
    });

    it('undefined for undefined', () => {
        expect(datetimeToLocktime(undefined)).toBeUndefined();
    });
});
