import { BigNumber } from '@trezor/utils';

import { formatExchangeRate } from '../numberUtils';

describe('formatExchangeRate', () => {
    it('rate >= 1 uses 3 decimal places', () => {
        expect(formatExchangeRate(new BigNumber('34.45023'))).toBe('34.450');
    });

    it('rate = 1 uses 3 decimal places', () => {
        expect(formatExchangeRate(new BigNumber('1'))).toBe('1.000');
    });

    it('rate < 1 shows 5 significant figures', () => {
        expect(formatExchangeRate(new BigNumber('0.0000753232344'))).toBe('0.000075323');
    });

    it('rate < 1 pads with trailing zeros for alignment', () => {
        expect(formatExchangeRate(new BigNumber('0.000075'))).toBe('0.000075000');
    });

    it('rate close to 1 shows 5 significant figures', () => {
        expect(formatExchangeRate(new BigNumber('0.5'))).toBe('0.50000');
    });
});
