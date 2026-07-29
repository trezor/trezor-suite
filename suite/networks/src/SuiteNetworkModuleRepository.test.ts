import { createNetworksCompositionRoot } from '@suite-common/networks';
import { networks } from '@suite-common/wallet-config';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import type { SuiteNetworkModules } from './SuiteNetworkModules';

describe('SuiteNetworkModuleRepository', () => {
    it('registers every network that exposes Sign & Verify', () => {
        const suiteCommonNetworkModules = createNetworksCompositionRoot();
        const signVerify = { Component: () => null };
        const suiteNetworkModules: SuiteNetworkModules = {
            bitcoin: { ...suiteCommonNetworkModules.bitcoin, signVerify },
            ethereum: { ...suiteCommonNetworkModules.ethereum, signVerify },
            cardano: { ...suiteCommonNetworkModules.cardano, signVerify },
        };
        const repository = createSuiteNetworkModuleRepository({ suiteNetworkModules });
        const expectedNetworks = Object.values(networks)
            .filter(network => (network.features as readonly string[]).includes('sign-verify'))
            .map(network => network.symbol)
            .sort();

        expect([...repository.getSupportedNetworks()].sort()).toEqual(expectedNetworks);
        expectedNetworks.forEach(symbol => {
            expect(repository.get(symbol)?.signVerify.Component).toBeDefined();
        });
    });
});
