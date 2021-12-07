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
});
