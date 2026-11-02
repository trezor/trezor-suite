import { getEarnYieldClaimContractAddress, isEarnYieldClaimSupported } from './earnRewardsProvider';
import { asNetworkSymbol } from './networkTypes';

describe(isEarnYieldClaimSupported.name, () => {
    it.each(['eth', 'arb', 'base', 'op'])('supports claims on %s without debug mode', symbol => {
        const networkSymbol = asNetworkSymbol(symbol);

        expect(isEarnYieldClaimSupported(networkSymbol)).toBe(true);
        expect(getEarnYieldClaimContractAddress(networkSymbol)).toBeDefined();
    });

    it.each(['btc', 'pol', 'tsep'])('rejects %s without a claim contract', symbol => {
        const networkSymbol = asNetworkSymbol(symbol);

        expect(isEarnYieldClaimSupported(networkSymbol)).toBe(false);
        expect(getEarnYieldClaimContractAddress(networkSymbol)).toBeUndefined();
    });
});
