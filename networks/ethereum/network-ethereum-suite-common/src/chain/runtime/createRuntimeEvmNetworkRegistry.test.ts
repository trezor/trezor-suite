import {
    type ExternalStore,
    createInMemoryRuntimeNetworkPreferencesStore,
} from '@trezor/network-module-suite-common-types';

import { validateRuntimeEvmNetworkDefinition } from './RuntimeEvmNetworkDefinition';
import { createRuntimeEvmNetworkRegistry } from './createRuntimeEvmNetworkRegistry';

const builtIn = { reservedSymbols: new Set(['eth']), reservedChainIds: new Set([1]) };

const createSource = <T>(initial: T) => {
    let value = initial;
    const listeners = new Set<() => void>();
    const source: ExternalStore<T> = {
        getSnapshot: () => value,
        subscribe: listener => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
    };

    return {
        source,
        set: (next: T) => {
            value = next;
            listeners.forEach(listener => listener());
        },
    };
};

const definition = (() => {
    const result = validateRuntimeEvmNetworkDefinition(
        {
            symbol: 'own',
            chainId: 3001,
            name: 'Own Chain',
            nativeSymbol: 'OWN',
            decimals: 18,
            rpcUrls: ['https://rpc.example.com'],
        },
        { source: 'user', ...builtIn },
    );
    if (!result.success) throw new Error(result.error);

    return result.definition;
})();

const createRegistry = () => {
    const preferences = createInMemoryRuntimeNetworkPreferencesStore();
    const trezorListed = createSource<readonly unknown[]>([]);
    const isActive = createSource(true);
    const registry = createRuntimeEvmNetworkRegistry({
        preferences,
        trezorListed: trezorListed.source,
        isActive: isActive.source,
        builtIn,
    });

    return { registry, trezorListed, isActive };
};

describe(createRuntimeEvmNetworkRegistry.name, () => {
    it('keeps its snapshot until a source changes', () => {
        const { registry } = createRegistry();

        expect(registry.getSnapshot()).toBe(registry.getSnapshot());
    });

    it('reads the networks the user turned on, and none while inactive', () => {
        const { registry, isActive } = createRegistry();
        const listener = jest.fn();
        registry.subscribe(listener);

        registry.addUserDefinition(definition);
        expect(registry.getSnapshot().enabledDefinitions).toEqual([]);

        registry.setEnabled('user:own', true);
        expect(registry.getSnapshot().enabledDefinitions).toEqual([definition]);

        isActive.set(false);
        expect(registry.getSnapshot()).toMatchObject({ isActive: false, enabledDefinitions: [] });
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it("follows Trezor's list", () => {
        const { registry, trezorListed } = createRegistry();

        trezorListed.set([{ ...definition, symbol: 'abc', chainId: 1001, source: undefined }]);

        expect(registry.getSnapshot().networks.map(({ key }) => key)).toEqual(['trezor:abc']);
    });

    it('stops calling a listener that unsubscribed', () => {
        const { registry } = createRegistry();
        const listener = jest.fn();

        registry.subscribe(listener)();
        registry.addUserDefinition(definition);

        expect(listener).not.toHaveBeenCalled();
    });
});
