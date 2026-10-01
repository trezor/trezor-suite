import { mock } from '@suite-common/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type NetworkModuleRepositoryDeps,
    createNetworkModuleRepository,
} from './NetworkModuleRepository';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

describe('createNetworkModuleRepository', () => {
    it('looks up networks from an injected list of independent modules', () => {
        const deps: NetworkModuleRepositoryDeps = {
            networkModules: [
                mockNetworkModule({
                    getSupportedNetworks: mock(() => [asNetworkSymbol('custom')]),
                }),
                mockNetworkModule({
                    getSupportedNetworks: mock(() => [
                        asNetworkSymbol('eth'),
                        asNetworkSymbol('base'),
                    ]),
                }),
            ],
        };
        Object.freeze(deps.networkModules);

        const repository = createNetworkModuleRepository(deps);

        expect(repository.get(asNetworkSymbol('custom'))).toBe(deps.networkModules[0]);
        expect(repository.get(asNetworkSymbol('eth'))).toBe(deps.networkModules[1]);
        expect(repository.get(asNetworkSymbol('base'))).toBe(deps.networkModules[1]);
        expect(repository.getSupportedNetworks()).toEqual(['custom', 'eth', 'base']);
        expect(repository.isSupportedNetwork('custom')).toBe(true);
        expect(repository.isSupportedNetwork('unknown')).toBe(false);
        expect(() => repository.get(asNetworkSymbol('unknown'))).toThrow(
            'Network module for unknown is not registered.',
        );
    });

    it('supports an empty registry', () => {
        const deps: NetworkModuleRepositoryDeps = { networkModules: [] };

        const repository = createNetworkModuleRepository(deps);

        expect(repository.getSupportedNetworks()).toEqual([]);
        expect(repository.isSupportedNetwork('btc')).toBe(false);
        expect(() => repository.get(asNetworkSymbol('btc'))).toThrow(
            'Network module for btc is not registered.',
        );
    });

    it('keeps the last registered module for duplicate symbols without duplicating their order', () => {
        const deps: NetworkModuleRepositoryDeps = {
            networkModules: [
                mockNetworkModule({
                    getSupportedNetworks: mock(() => [
                        asNetworkSymbol('eth'),
                        asNetworkSymbol('base'),
                    ]),
                }),
                mockNetworkModule({
                    getSupportedNetworks: mock(() => [asNetworkSymbol('eth')]),
                }),
            ],
        };

        const repository = createNetworkModuleRepository(deps);

        expect(repository.get(asNetworkSymbol('eth'))).toBe(deps.networkModules[1]);
        expect(repository.get(asNetworkSymbol('base'))).toBe(deps.networkModules[0]);
        expect(repository.getSupportedNetworks()).toEqual(['eth', 'base']);
    });
});
