import { formatTimeLeft } from '@suite-utils/formatTimeLeft';
import enLocale from 'date-fns/locale/en-US/index';

describe('formatTimeLeft', () => {
    global.Date.now = jest.fn(() => new Date('2022-02-22T22:22:22Z').getTime());

    it('correctly formats with default params', () => {
        expect(formatTimeLeft(new Date('2022-02-22T23:22:22Z'), enLocale)).toEqual('1 hour');
    });

    it('correctly formats with more units', () => {
        expect(
            formatTimeLeft(new Date('2022-02-23T23:23:22Z'), enLocale, [
                'days',
                'hours',
                'minutes',
            ]),
        ).toEqual('1 day 1 hour 1 minute');
    });

    global.Date.now = Date.now;
});
