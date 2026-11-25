import { asNetworkSymbol } from '@suite-common/wallet-config';

import { isStakeInsideAccountBalance } from './isStakeInsideAccountBalance';

describe(isStakeInsideAccountBalance.name, () => {
    it('keeps a Cardano stake inside the balance', () => {
        expect(isStakeInsideAccountBalance(asNetworkSymbol('ada'))).toBe(true);
    });

    it('keeps the stake of other networks outside it', () => {
        expect(isStakeInsideAccountBalance(asNetworkSymbol('eth'))).toBe(false);
        expect(isStakeInsideAccountBalance(asNetworkSymbol('sol'))).toBe(false);
    });
});
