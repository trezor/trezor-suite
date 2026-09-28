import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getMobileStakingSupport } from './mobileStakingSupport';

describe('getMobileStakingSupport', () => {
    it('manages staking on Ethereum and Solana', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('eth'))).toBe('manage');
        expect(getMobileStakingSupport(asNetworkSymbol('sol'))).toBe('manage');
    });

    it('only views staking positions on Cardano', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('ada'))).toBe('view');
    });

    it('leaves Tron staking to the desktop app', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('trx'))).toBe('desktop-only');
    });

    it('returns null for a network without staking', () => {
        expect(getMobileStakingSupport(asNetworkSymbol('btc'))).toBeNull();
    });
});
