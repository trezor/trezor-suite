import { createMockDeps } from '@trezor/dependency-injection';
import { type NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { asNetworkSymbol } from './NetworkModules';
import {
    type GetAccountSyncIntervalDeps,
    createGetAccountSyncInterval,
    injectGetAccountSyncInterval,
} from './createGetAccountSyncInterval';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';
import {
    type NetworksCompositionRootDeps,
    createNetworksCompositionRoot,
} from './createNetworksCompositionRoot';

it('preserves the account sync cadence of every registered network', () => {
    const networkModuleRepository = createNetworkModuleRepository({
        networkModules: createNetworkModulesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
    });
    const getAccountSyncInterval = createGetAccountSyncInterval(
        createMockDeps<GetAccountSyncIntervalDeps>({ networkModuleRepository }),
    );
    const expectedIntervals = {
        btc: 60_000,
        test: 60_000,
        regtest: 60_000,
        ltc: 60_000,
        doge: 60_000,
        zec: 60_000,
        bch: 60_000,
        eth: 60_000,
        pol: 40_000,
        bsc: 40_000,
        arb: 40_000,
        base: 40_000,
        op: 40_000,
        rhc: 40_000,
        hype: 40_000,
        avax: 40_000,
        etc: 60_000,
        tsep: 60_000,
        thod: 60_000,
        arc: 60_000,
        tarc: 60_000,
        ada: 60_000,
        xrp: 60_000,
        txrp: 60_000,
        sol: 300_000,
        dsol: 60_000,
        xlm: 60_000,
        txlm: 60_000,
        trx: 40_000,
        ttrx: 60_000,
    };

    expect(networkModuleRepository.getSupportedNetworks().toSorted()).toEqual(
        Object.keys(expectedIntervals).toSorted(),
    );
    Object.entries(expectedIntervals).forEach(([symbol, interval]) => {
        const networkSymbol = asNetworkSymbol(symbol);

        expect(getAccountSyncInterval(networkSymbol)).toBe(interval);
    });
});

it('exposes the service through the networks composition root and injector', () => {
    const networks = createNetworksCompositionRoot(
        createMockDeps<NetworksCompositionRootDeps>({ getTrezorConnect: null, dispatch: null }),
    );
    const { getAccountSyncInterval } = injectGetAccountSyncInterval({ networks });

    expect(getAccountSyncInterval).toBe(networks.getAccountSyncInterval);
    expect(getAccountSyncInterval(asNetworkSymbol('sol'))).toBe(300_000);
});

it('rejects a network without a registered module', () => {
    const networkModuleRepository = createNetworkModuleRepository({
        networkModules: createNetworkModulesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
    });
    const getAccountSyncInterval = createGetAccountSyncInterval(
        createMockDeps<GetAccountSyncIntervalDeps>({ networkModuleRepository }),
    );

    expect(() => getAccountSyncInterval(asNetworkSymbol('unknown-network'))).toThrow(
        'Network module for unknown-network is not registered.',
    );
});
