import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import { getEarnYieldClaimContractAddress, isEarnYieldClaimSupported } from './earnRewardsProvider';
import { asNetworkSymbol } from './networkTypes';
import { getNetworkFeatures, getSupportedNetworks } from './utils';

const networkConfigDeps = mockNetworkConfigDeps();

const arbSymbol = asNetworkSymbol('arb');

describe(isEarnYieldClaimSupported.name, () => {
    it('has a claim contract address for every network with the claim-rewards feature', () => {
        const networkSymbolsWithClaimFeature = getSupportedNetworks(networkConfigDeps).filter(
            networkSymbol =>
                getNetworkFeatures(networkConfigDeps, networkSymbol).includes('claim-rewards'),
        );

        expect(networkSymbolsWithClaimFeature.length).toBeGreaterThan(0);

        networkSymbolsWithClaimFeature.forEach(networkSymbol => {
            expect(getEarnYieldClaimContractAddress(networkSymbol)).toBeDefined();
        });
    });

    it('does not support claim on a network without the claim-rewards feature', () => {
        // Arbitrum has a claim contract address but the feature flag is not enabled.
        expect(getNetworkFeatures(networkConfigDeps, arbSymbol)).not.toContain('claim-rewards');
        expect(isEarnYieldClaimSupported(networkConfigDeps, arbSymbol)).toBe(false);
    });

    it('supports claim in debug mode on networks with a claim contract address', () => {
        expect(isEarnYieldClaimSupported(networkConfigDeps, arbSymbol, { isDebugMode: true })).toBe(
            true,
        );
        expect(
            isEarnYieldClaimSupported(networkConfigDeps, asNetworkSymbol('btc'), {
                isDebugMode: true,
            }),
        ).toBe(false);
    });

    it('supports claim on networks with both the feature and a contract address', () => {
        expect(isEarnYieldClaimSupported(networkConfigDeps, asNetworkSymbol('eth'))).toBe(true);
    });
});
