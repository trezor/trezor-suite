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
