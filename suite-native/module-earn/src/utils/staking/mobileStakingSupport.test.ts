import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getMobileStakingSupport } from './mobileStakingSupport';

describe('getMobileStakingSupport', () => {
    it('manages staking on Ethereum and Solana', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('eth'))).toBe('manage');
        expect(getMobileStakingSupport(asNetworkSymbol('sol'))).toBe('manage');
    });

    it('only views staking positions on Cardano and Tron', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('ada'))).toBe('view');
        expect(getMobileStakingSupport(asNetworkSymbol('trx'))).toBe('view');
    });

    it('returns null for a network without staking', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('btc'))).toBeNull();
    });
});
