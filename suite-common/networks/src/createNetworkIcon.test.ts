import { createMockDeps, mock } from '@trezor/dependency-injection';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { type NetworkIconDeps, createNetworkIcon, injectNetworkIcon } from './createNetworkIcon';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';
import {
    type NetworksCompositionRootDeps,
    createNetworksCompositionRoot,
} from './createNetworksCompositionRoot';
import { mockNetworkIcon } from '../mocks/mockNetworkIcon';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

const createIconDeps = () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    const repository = createNetworkModuleRepository({ networkModules });
    const ethereumModule = repository.get(asNetworkSymbol('eth'));
    ethereumModule.icon = mockNetworkIcon({
        getIcon: symbol => ({
            testnet: false,
            coin: `${symbol}.svg`,
            network: `${symbol}-badge.svg`,
        }),
        getTokenLogoIdentifiers: (_symbol, contract) => (contract ? [contract.toLowerCase()] : []),
        isWrappedNativeToken: (_symbol, contract) => contract === 'wrapped',
    });
    const deps = createMockDeps<NetworkIconDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => [asNetworkSymbol('eth'), asNetworkSymbol('op')],
            isSupportedNetwork: (symbol): symbol is NetworkSymbol =>
                symbol === 'eth' || symbol === 'op',
            get: repository.get,
        },
    });

    return { deps, ethereumModule };
};

it('reads individual icon sources without choosing how a component renders them', () => {
    const { deps } = createIconDeps();
    const iconService = createNetworkIcon(deps);

    expect(iconService.getCryptoIcon('op')).toBe('op.svg');
    expect(iconService.getNetworkIcon(asNetworkSymbol('op'))).toBe('op-badge.svg');
    expect(iconService.hasNetworkIcon('btc')).toBe(false);
    expect(iconService.getCryptoIcon('unregistered')).toBeUndefined();
    expect(iconService.isWrappedNativeToken('eth', 'wrapped')).toBe(true);
    expect(iconService.isWrappedNativeToken('op', 'TOKEN')).toBe(false);
});

it('preserves synchronous and asynchronous token lookup results from the module', async () => {
    const { deps, ethereumModule } = createIconDeps();
    const iconService = createNetworkIcon(deps);

    expect(iconService.getTokenLogoIdentifiers('op', 'TOKEN')).toEqual(['token']);
    ethereumModule.icon.getTokenLogoIdentifiers = () => Promise.resolve(['classic', 'derived']);
    expect(await iconService.getTokenLogoIdentifiers('op', 'TOKEN')).toEqual([
        'classic',
        'derived',
    ]);
    expect(iconService.getTokenLogoIdentifiers('unregistered', 'TOKEN')).toEqual(['TOKEN']);
});

it('uses the icon service of the app network module', () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    const repository = createNetworkModuleRepository({ networkModules });
    repository.get(asNetworkSymbol('ada')).icon.getIcon = () => ({
        testnet: false,
        coin: 'app-ada.svg',
        network: 'app-ada-badge.svg',
    });
    const networkModuleRepository = repository;
    const deps: NetworkIconDeps = {
        networkModuleRepository: {
            ...networkModuleRepository,
            getSupportedNetworks: () => [asNetworkSymbol('ada')],
        },
    };
    const iconService = createNetworkIcon(deps);

    expect(iconService.getIcon(asNetworkSymbol('ada')).coin).toBe('app-ada.svg');
    expect(iconService.getCryptoIcon('unregistered')).toBeUndefined();
});

it('keeps native asset references intact in the common lookup service', () => {
    const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
    const repository = createNetworkModuleRepository({ networkModules });
    repository.get(asNetworkSymbol('ada')).icon.getIcon = () => ({
        testnet: false,
        coin: 42,
        network: 43,
    });
    const deps: NetworkIconDeps = { networkModuleRepository: repository };
    const iconService = createNetworkIcon(deps);
    expect(iconService.getIcon(asNetworkSymbol('ada'))).toEqual({
        testnet: false,
        coin: 42,
        network: 43,
    });
});

it('loads icons only when requested and reads the current module capability', () => {
    const getIcon = mock(() => ({ coin: 'custom.svg', network: 42, testnet: false }));
    const networkModule = mockNetworkModule({
        getSupportedNetworks: () => [asNetworkSymbol('btc')],
        icon: mockNetworkIcon({ getIcon }),
    });
    const deps: NetworkIconDeps = {
        networkModuleRepository: createNetworkModuleRepository({ networkModules: [networkModule] }),
    };
    const iconService = createNetworkIcon(deps);

    expect(getIcon).not.toHaveBeenCalled();
    expect(iconService.getIcon(asNetworkSymbol('btc'))).toEqual({
        coin: 'custom.svg',
        network: 42,
        testnet: false,
    });
    expect(getIcon).toHaveBeenCalledWith(asNetworkSymbol('btc'));
    networkModule.icon.getIcon = () => ({ coin: 'updated.svg', network: 43, testnet: false });
    expect(iconService.getIcon(asNetworkSymbol('btc')).coin).toBe('updated.svg');
    expect(() => iconService.getIcon(asNetworkSymbol('ada'))).toThrow(
        'Network module for ada is not registered.',
    );
});

it('resolves display symbols without adding them to wallet network support', () => {
    const deps: NetworkIconDeps = {
        networkModuleRepository: createNetworkModuleRepository({
            networkModules: createNetworkModulesCompositionRoot({ getTrezorConnect: mock() }),
        }),
    };
    const iconService = createNetworkIcon(deps);

    expect(deps.networkModuleRepository.isSupportedNetwork('bnb')).toBe(false);
    expect(iconService.getCryptoIcon('bnb')).toBe(iconService.getIcon(asNetworkSymbol('bsc')).coin);
    expect(iconService.hasNetworkIcon('bnb')).toBe(false);
    expect(iconService.getCryptoIcon('unregistered')).toBeUndefined();
});

it('exposes the icon service through the networks composition root and injector', () => {
    const networks = createNetworksCompositionRoot(
        createMockDeps<NetworksCompositionRootDeps>({ getTrezorConnect: null, dispatch: null }),
    );

    expect(injectNetworkIcon({ networks }).networkIcon).toBe(networks.networkIcon);
    expect(networks.networkIcon.getIcon(asNetworkSymbol('eth')).coin).toBeDefined();
});
