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

    test('get date with timezone', () => {
        const dateInMs = 1565797979000;

        expect(utils.getDateWithTimeZone(dateInMs, 'Asia/Tokyo')).toEqual(
            new Date('2019-08-15T00:52:59.000Z'),
        );
        expect(utils.getDateWithTimeZone(dateInMs)).toEqual(new Date('2019-08-14T15:52:59.000Z'));
    });

    test('get months between timestamps', () => {
        // from 11/09/2019 to 03/04/2020
        expect(
            utils.getTicksBetweenTimestamps(
                new Date(1573313530000),
                new Date(1583313530000),
                'month',
            ),
        ).toStrictEqual([
            new Date('2019-11-09T15:32:10.000Z'),
            new Date('2019-12-09T15:32:10.000Z'),
            new Date('2020-01-09T15:32:10.000Z'),
            new Date('2020-02-09T15:32:10.000Z'),
            new Date('2020-03-09T15:32:10.000Z'),
        ]);
        // end date is before start date
        expect(
            utils.getTicksBetweenTimestamps(
                new Date(1583313530000),
                new Date(1573313530000),
                'month',
            ),
        ).toStrictEqual([]);
    });

    test('get timestamps between from and to split by hour', () => {
        expect(utils.splitTimestampsByInterval(1584845764, 1584867364, 3600, true)).toStrictEqual([
            1584845764,
            1584849364,
            1584852964,
            1584856564,
            1584860164,
            1584863764,
            1584867364,
        ]);
    });
});
