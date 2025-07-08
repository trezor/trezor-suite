import { formatDuration, formatDurationStrict, parseUTCdatetime } from '../date';

describe('Date utils', () => {
    test('format duration', () => {
        expect(formatDuration(1)).toBe('less than 5 seconds');
        expect(formatDuration(3600)).toBe('about 1 hour');
        expect(formatDuration(14400)).toBe('about 4 hours');
        expect(formatDuration(86400)).toBe('1 day');
        expect(formatDuration(604800)).toBe('7 days');
        expect(formatDuration(31556926)).toBe('about 1 year');
        expect(formatDuration(63671184000)).toBe('over 2017 years'); // jesus was born
        expect(formatDuration(99999999999)).toBe('almost 3169 years');
    });

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

    it('undefined for undefined', () => {
        expect(parseUTCdatetime(undefined)).toBeUndefined();
    });
});
