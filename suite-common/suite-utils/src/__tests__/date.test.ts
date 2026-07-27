import { formatDurationStrict, parseUTCdatetime } from '../date';

describe('Date utils', () => {
    test('format duration strict', () => {
        expect(formatDurationStrict(1)).toBe('1 second');
        expect(formatDurationStrict(3600)).toBe('1 hour');
        expect(formatDurationStrict(14400)).toBe('4 hours');
        expect(formatDurationStrict(86400)).toBe('1 day');
        expect(formatDurationStrict(604800)).toBe('7 days');
        expect(formatDurationStrict(31556926)).toBe('1 year');
        expect(formatDurationStrict(63671184000)).toBe('2019 years'); // jesus was born
        expect(formatDurationStrict(99999999999)).toBe('3171 years');
    });
});

describe(parseUTCdatetime.name, () => {
    it('dd/MM/yyyy', () => {
        const result = parseUTCdatetime('08/07/2025');
        expect(result?.toISOString()).toBe('2025-07-08T00:00:00.000Z');
    });

    it('dd/MM/yyyy HH:mm', () => {
        const result = parseUTCdatetime('08/07/2025 14:30');
        expect(result?.toISOString()).toBe('2025-07-08T14:30:00.000Z');
    });

    it('dd/MM/yyyy HH:mm:ss', () => {
        const result = parseUTCdatetime('08/07/2025 14:30:45');
        expect(result?.toISOString()).toBe('2025-07-08T14:30:45.000Z');
    });

    it('invalid input', () => {
        expect(parseUTCdatetime('not a date')).toBeUndefined();
    });
});
