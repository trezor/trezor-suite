import * as utils from '../date';

describe('Date utils', () => {
    test('timezone should always be UTC', () => {
        expect(new Date().getTimezoneOffset()).toBe(0);
    });

    test('format duration', () => {
        expect(utils.formatDuration(1)).toBe('less than 5 seconds');
        expect(utils.formatDuration(3600)).toBe('about 1 hour');
        expect(utils.formatDuration(14400)).toBe('about 4 hours');
        expect(utils.formatDuration(86400)).toBe('1 day');
        expect(utils.formatDuration(604800)).toBe('7 days');
        expect(utils.formatDuration(31556926)).toBe('about 1 year');
        expect(utils.formatDuration(63671184000)).toBe('over 2017 years'); // jesus was born
        expect(utils.formatDuration(99999999999)).toBe('almost 3169 years');
    });

    test('format duration strict', () => {
        expect(utils.formatDurationStrict(1)).toBe('1 second');
        expect(utils.formatDurationStrict(3600)).toBe('1 hour');
        expect(utils.formatDurationStrict(14400)).toBe('4 hours');
        expect(utils.formatDurationStrict(86400)).toBe('1 day');
        expect(utils.formatDurationStrict(604800)).toBe('7 days');
        expect(utils.formatDurationStrict(31556926)).toBe('1 year');
        expect(utils.formatDurationStrict(63671184000)).toBe('2019 years'); // jesus was born
        expect(utils.formatDurationStrict(99999999999)).toBe('3171 years');
    });
});
