import * as coinjoinUtils from '../coinjoinUtils';
import * as fixtures from '../__fixtures__/coinjoinUtils';

describe('breakdownCoinjoinBalance', () => {
    it('works without session', () => {
        const breakdown = coinjoinUtils.breakdownCoinjoinBalance(fixtures.breakdownParams);

        expect(breakdown).toEqual({
            notAnonymized: '200',
            anonymized: '100',
        });
    });
});

describe('calculateAnonymityProgress', () => {
    it('calculates correctly', () => {
        fixtures.calculateProgressParams.forEach(({ params, result }) => {
            const progress = coinjoinUtils.calculateAnonymityProgress(params);

            expect(progress).toEqual(result);
        });
    });
});

describe('getSessionDeadlineFormat', () => {
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2022-02-22T22:22:22Z').getTime());

    it('works with hours, munites and seconds left', () => {
        const result = coinjoinUtils.getSessionDeadlineFormat(
            new Date('2022-02-22T23:44:44').getTime(),
        );

        expect(result).toEqual(['hours']);
    });

    it('works with minutes and seconds left', () => {
        const result = coinjoinUtils.getSessionDeadlineFormat(
            new Date('2022-02-22T22:24:44Z').getTime(),
        );

        expect(result).toEqual(['minutes']);
    });

    it('works with seconds left', () => {
        const result = coinjoinUtils.getSessionDeadlineFormat(
            new Date('2022-02-22T22:22:44Z').getTime(),
        );

        expect(result).toEqual(['seconds']);
    });
});
