import { createMockDeps, mock } from '@suite-common/dependency-injection';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { type NetworkSymbol } from './NetworkModules';
import {
    type NetworkIconRegistryDeps,
    createNetworkIconRegistry,
} from './createNetworkIconRegistry';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';

const createRegistryDeps = () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    networkModules.ethereum.icon = {
        getIcons: symbol => ({ coin: `${symbol}.svg`, network: `${symbol}-badge.svg` }),
        getTokenLogoIdentifiers: (_symbol, contract) => [contract.toLowerCase()],
        isWrappedNativeToken: (_symbol, contract) => contract === 'wrapped',
    };
    const repository = createNetworkModuleRepository({ networkModules });
    const deps = createMockDeps<NetworkIconRegistryDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => ['eth', 'op'],
            isSupportedNetwork: (symbol): symbol is NetworkSymbol =>
                symbol === 'eth' || symbol === 'op',
            get: repository.get,
        },
    });

    return { deps, networkModules };
};

it('uses only registered modules, with no global fallback', () => {
    const { deps } = createRegistryDeps();
    const registry = createNetworkIconRegistry(deps);
    expect(registry.getNetworkIcon('eth')?.src).toBe('eth.svg');
    expect(registry.getNetworkIcon('btc')).toBeUndefined();
    deps.networkModuleRepository.getSupportedNetworks.mockReturnValue([]);
    deps.networkModuleRepository.isSupportedNetwork.mockReturnValue(false);
    expect(createNetworkIconRegistry(deps).getNetworkIcon('eth')).toBeUndefined();
});

it('resolves native L2 and wrapped-token badges through the registered module', () => {
    const { deps } = createRegistryDeps();
    const registry = createNetworkIconRegistry(deps);
    expect(registry.getTokenIcon({ symbol: 'op', showNetworkIcon: true })).toMatchObject({
        src: 'eth.svg',
        badge: { src: 'op-badge.svg', testnet: false },
    });
    expect(
        registry.getTokenIcon({
            symbol: 'eth',
            contractAddress: 'wrapped',
            wrappedTokenIcon: 'network',
            showNetworkIcon: true,
        }),
    ).toMatchObject({ src: 'eth.svg', badge: { src: 'eth-badge.svg' } });
    expect(registry.getTokenIcon({ symbol: 'op' })).toEqual({ src: 'op.svg' });
});

it('delegates logo identifiers to the nested service, including asynchronous candidates', async () => {
    const { deps, networkModules } = createRegistryDeps();
    networkModules.ethereum.icon.getTokenLogoIdentifiers = () =>
        Promise.resolve(['classic', 'derived']);
    const registry = createNetworkIconRegistry(deps);
    expect(
        await registry.getTokenIcon({
            symbol: 'op',
            contractAddress: 'TOKEN',
            showNetworkIcon: true,
        }),
    ).toMatchObject({
        coingeckoId: networkModules.ethereum.getNetworkConfig('op').coingeckoId,
        contractAddresses: ['classic', 'derived'],
        badge: { src: 'op-badge.svg' },
    });
});

it('uses the icon service of the app network module', () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    networkModules.cardano.icon = {
        getIcons: () => ({ coin: 'app-ada.svg', network: 'app-ada-badge.svg' }),
        getTokenLogoIdentifiers: (_symbol, contract) => [contract],
    };
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const deps: NetworkIconRegistryDeps = {
        networkModuleRepository: {
            ...networkModuleRepository,
            getSupportedNetworks: () => ['ada'],
        },
    };
    const registry = createNetworkIconRegistry(deps);

    expect(registry.getNetworkIcon('ada')?.src).toBe('app-ada.svg');
    expect(registry.getNetworkIcon('unregistered')).toBeUndefined();
});

it('keeps native asset references intact in the module service', () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    networkModules.cardano.icon = {
        getIcons: () => ({ coin: 42, network: 43 }),
        getTokenLogoIdentifiers: (_symbol, contract) => [contract],
    };
    const repository = createNetworkModuleRepository({ networkModules });

    expect(repository.get('ada').icon.getIcons('ada')).toEqual({ coin: 42, network: 43 });
});
