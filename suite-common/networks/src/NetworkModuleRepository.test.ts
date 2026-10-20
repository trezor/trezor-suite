import { createMockDeps } from '@trezor/dependency-injection';
import { createCustomEvmNetworkModule } from '@trezor/network-ethereum-suite-common';
import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { asNetworkSymbol } from './NetworkModules';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

const customSymbol = asNetworkSymbol('evm4242');

const createRepository = () =>
    createNetworkModuleRepository({
        networkModules: createNetworkModulesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
    });

const createCustomModule = () =>
    createCustomEvmNetworkModule({
        symbol: customSymbol,
        config: mockNetworkMetadata.eth,
    });

describe('network module repository runtime registration', () => {
    it('does not know a custom network until it is registered', () => {
        const repository = createRepository();

        expect(repository.isSupportedNetwork(customSymbol)).toBe(false);
        expect(() => repository.get(customSymbol)).toThrow('is not registered');
    });

    it('serves a registered module and lists its symbol', () => {
        const repository = createRepository();
        const supportedNetworks = repository.getSupportedNetworks();
        const networkModule = createCustomModule();

        repository.register(customSymbol, networkModule);

        expect(repository.get(customSymbol)).toBe(networkModule);
        expect(repository.isSupportedNetwork(customSymbol)).toBe(true);
        expect(repository.getSupportedNetworks()).toContain(customSymbol);
        // The list is kept current in place, so earlier references see the change.
        expect(supportedNetworks).toContain(customSymbol);
    });

    it('lists a re-registered symbol once and keeps the latest module', () => {
        const repository = createRepository();
        const latestModule = createCustomModule();

        repository.register(customSymbol, createCustomModule());
        repository.register(customSymbol, latestModule);

        expect(repository.get(customSymbol)).toBe(latestModule);
        expect(repository.getSupportedNetworks().filter(s => s === customSymbol)).toHaveLength(1);
    });

    it('forgets an unregistered module', () => {
        const repository = createRepository();

        repository.register(customSymbol, createCustomModule());
        repository.unregister(customSymbol);

        expect(repository.isSupportedNetwork(customSymbol)).toBe(false);
        expect(repository.getSupportedNetworks()).not.toContain(customSymbol);
        expect(() => repository.get(customSymbol)).toThrow('is not registered');
    });

    it('never lets a bundled network be replaced or removed', () => {
        const repository = createRepository();
        const ethSymbol = asNetworkSymbol('eth');
        const bundledModule = repository.get(ethSymbol);

        expect(() => repository.register(ethSymbol, mockNetworkModule())).toThrow('is bundled');
        expect(() => repository.unregister(ethSymbol)).toThrow('is bundled');
        expect(repository.get(ethSymbol)).toBe(bundledModule);
    });

    it('lets the custom module answer the address validator and sync interval', () => {
        const repository = createRepository();

        repository.register(customSymbol, createCustomModule());
        const networkModule = repository.get(customSymbol);

        expect(networkModule.getAccountSyncInterval(customSymbol)).toBe(60_000);
        expect(
            networkModule.addressValidator.isAddressValid(
                '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
                customSymbol,
            ),
        ).toBe(true);
    });
});
