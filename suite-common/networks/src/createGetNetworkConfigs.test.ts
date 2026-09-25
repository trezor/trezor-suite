import { createMockDeps } from '@suite-common/dependency-injection';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { type NetworkSymbol, asNetworkSymbol } from './NetworkModules';
import { createGetNetworkConfig } from './createGetNetworkConfig';
import { type GetNetworkConfigsDeps, createGetNetworkConfigs } from './createGetNetworkConfigs';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';
import { getMockNetworkMetadata, mockNetworkMetadata } from '../mocks/mockNetworkMetadata';

it('loads only registered networks and takes their metadata from the module', () => {
    const config = { ...mockNetworkMetadata.btc, name: 'Registered Bitcoin' };
    const deps = createMockDeps<GetNetworkConfigsDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => [asNetworkSymbol('btc')],
            get: null,
            isSupportedNetwork: null,
        },
        getNetworkConfig: () => config,
    });

    expect(createGetNetworkConfigs(deps)()).toEqual([config]);
});

it('preserves display order without mutating registered networks on Hermes', () => {
    const supportedNetworks: NetworkSymbol[] = [asNetworkSymbol('eth'), asNetworkSymbol('btc')];
    Object.defineProperty(supportedNetworks, 'toSorted', { value: undefined });
    Object.freeze(supportedNetworks);

    const deps = createMockDeps<GetNetworkConfigsDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => supportedNetworks,
            get: null,
            isSupportedNetwork: null,
        },
        getNetworkConfig: getMockNetworkMetadata,
    });

    expect(createGetNetworkConfigs(deps)().map(network => network.symbol)).toEqual(['btc', 'eth']);
});

describe('with registered network modules', () => {
    const getRegisteredNetworkConfigs = () => {
        const networkModuleRepository = createNetworkModuleRepository({
            networkModules: createNetworkModulesCompositionRoot(
                createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
            ),
        });
        const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });

        return createGetNetworkConfigs({ getNetworkConfig, networkModuleRepository })();
    };

    it('keeps the established display order', () => {
        expect(getRegisteredNetworkConfigs().map(network => network.symbol)).toEqual([
            'btc',
            'eth',
            'pol',
            'bsc',
            'arb',
            'base',
            'op',
            'rhc',
            'hype',
            'avax',
            'sol',
            'trx',
            'ada',
            'etc',
            'xrp',
            'xlm',
            'ltc',
            'bch',
            'doge',
            'zec',
            'test',
            'regtest',
            'tsep',
            'thod',
            'dsol',
            'txrp',
            'txlm',
            'ttrx',
        ]);
    });

    it('assigns a unique display order key to every network', () => {
        const networkConfigs = getRegisteredNetworkConfigs();
        const displayOrderKeys = new Set(networkConfigs.map(network => network.displayOrder));

        expect(displayOrderKeys.size).toBe(networkConfigs.length);
    });
});

it('orders networks with the same display order key by symbol', () => {
    const deps = createMockDeps<GetNetworkConfigsDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => [asNetworkSymbol('eth'), asNetworkSymbol('btc')],
            get: null,
            isSupportedNetwork: null,
        },
        getNetworkConfig: symbol => ({
            ...getMockNetworkMetadata(symbol),
            displayOrder: mockNetworkMetadata.btc.displayOrder,
        }),
    });

    expect(createGetNetworkConfigs(deps)().map(network => network.symbol)).toEqual(['btc', 'eth']);
});
