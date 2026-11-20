import { getRelativeTimeUnit } from './getRelativeTimeUnit';

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
