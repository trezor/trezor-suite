import { getEarnYieldClaimContractAddress, isEarnYieldClaimSupported } from './earnRewardsProvider';
import { asNetworkSymbol } from './types';
import { getNetworkFeatures, networkSymbolCollection } from './utils';

const arbSymbol = asNetworkSymbol('arb');

describe(isEarnYieldClaimSupported.name, () => {
    it('has a claim contract address for every network with the claim-rewards feature', () => {
        const networkSymbolsWithClaimFeature = networkSymbolCollection.filter(networkSymbol =>
            getNetworkFeatures(networkSymbol).includes('claim-rewards'),
        );

        expect(networkSymbolsWithClaimFeature.length).toBeGreaterThan(0);

        networkSymbolsWithClaimFeature.forEach(networkSymbol => {
            expect(getEarnYieldClaimContractAddress(networkSymbol)).toBeDefined();
        });
    });

    it('does not support claim on a network without the claim-rewards feature', () => {
        // Arbitrum has a claim contract address but the feature flag is not enabled.
        expect(getNetworkFeatures(arbSymbol)).not.toContain('claim-rewards');
        expect(isEarnYieldClaimSupported(arbSymbol)).toBe(false);
    });

    it('supports claim in debug mode on networks with a claim contract address', () => {
        expect(isEarnYieldClaimSupported(arbSymbol, { isDebugMode: true })).toBe(true);
        expect(isEarnYieldClaimSupported(asNetworkSymbol('btc'), { isDebugMode: true })).toBe(
            false,
        );
    });

    it('supports claim on networks with both the feature and a contract address', () => {
        expect(isEarnYieldClaimSupported(asNetworkSymbol('eth'))).toBe(true);
    });
});
