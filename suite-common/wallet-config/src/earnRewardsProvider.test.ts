import {
    createGetNetworkConfig,
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';

import { getEarnYieldClaimContractAddress, isEarnYieldClaimSupported } from './earnRewardsProvider';

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });
const deps = { getNetworkConfig };

describe(isEarnYieldClaimSupported.name, () => {
    it('has a claim contract address for every network with the claim-rewards feature', () => {
        const networkSymbolsWithClaimFeature = networkModuleRepository
            .getSupportedNetworks()
            .filter(networkSymbol =>
                getNetworkConfig(networkSymbol).features.includes('claim-rewards'),
            );

        expect(networkSymbolsWithClaimFeature.length).toBeGreaterThan(0);

        networkSymbolsWithClaimFeature.forEach(networkSymbol => {
            expect(getEarnYieldClaimContractAddress(networkSymbol)).toBeDefined();
        });
    });

    it('does not support claim on a network without the claim-rewards feature', () => {
        // Arbitrum has a claim contract address but the feature flag is not enabled.
        expect(getNetworkConfig('arb').features).not.toContain('claim-rewards');
        expect(isEarnYieldClaimSupported(deps, 'arb')).toBe(false);
    });

    it('supports claim in debug mode on networks with a claim contract address', () => {
        expect(isEarnYieldClaimSupported(deps, 'arb', { isDebugMode: true })).toBe(true);
        expect(isEarnYieldClaimSupported(deps, 'btc', { isDebugMode: true })).toBe(false);
    });

    it('supports claim on networks with both the feature and a contract address', () => {
        expect(isEarnYieldClaimSupported(deps, 'eth')).toBe(true);
    });
});
