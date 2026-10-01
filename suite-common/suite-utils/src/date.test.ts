import { format, getUnixTime, startOfMonth } from 'date-fns';

import {
    calcTicksFromData,
    formatDurationStrict,
    getRelativeTimeUnit,
    parseUTCdatetime,
} from './date';

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

describe(getRelativeTimeUnit.name, () => {
    const MINUTE = 60;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    it.each([
        [0, { value: 0, unit: 'second' }],
        [-59, { value: -59, unit: 'second' }],
        [-MINUTE, { value: -1, unit: 'minute' }],
        [-(HOUR - 1), { value: -59, unit: 'minute' }],
        [-5 * HOUR, { value: -5, unit: 'hour' }],
        [-29 * DAY, { value: -29, unit: 'day' }],
        [-30 * DAY, { value: -1, unit: 'month' }],
        [-364 * DAY, { value: -12, unit: 'month' }],
        [-365 * DAY, { value: -1, unit: 'year' }],
        [-3 * 365 * DAY, { value: -3, unit: 'year' }],
        [2 * HOUR, { value: 2, unit: 'hour' }],
    ])('expresses %i seconds from now as %o', (secondsFromNow, expected) => {
        expect(getRelativeTimeUnit(secondsFromNow)).toEqual(expected);
    });
});

describe(calcTicksFromData.name, () => {
    it('anchors the axis to the current month when there are no datapoints', () => {
        expect(calcTicksFromData([])).toEqual([startOfMonth(new Date())]);
    });

    it('returns monthly ticks spanning the datapoints', () => {
        const ticks = calcTicksFromData([
            { time: getUnixTime(new Date(2025, 0, 15)) },
            { time: getUnixTime(new Date(2025, 2, 15)) },
        ]);

        expect(ticks.map(tick => format(tick, 'yyyy-MM'))).toEqual([
            '2025-01',
            '2025-02',
            '2025-03',
        ]);
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
