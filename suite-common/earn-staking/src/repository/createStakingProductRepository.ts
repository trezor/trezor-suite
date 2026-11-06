import { z } from 'zod';

import {
    type StakingProductAdapter,
    type StakingProductId,
    type StakingProductModule,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type StakingProductRepositoryDeps = {
    productModules: readonly StakingProductModule[];
    /**
     * Called synchronously once a module's adapters are in the repository, so the callback
     * already sees them through `get`, `list`, `listBySymbol` and `isSupportedSymbol`.
     * It must not throw: a throw propagates to the caller of `ensureLoaded` while the module
     * stays registered, so the module is never loaded again.
     */
    onProductsRegistered: (adapters: readonly StakingProductAdapter[]) => void;
};

export type StakingProductRepository = {
    get: (productId: StakingProductId) => StakingProductAdapter;
    list: () => readonly StakingProductAdapter[];
    listBySymbol: (networkSymbol: NetworkSymbol) => readonly StakingProductAdapter[];
    isSupportedSymbol: (networkSymbol: NetworkSymbol) => boolean;
    /**
     * Loads the modules serving any of the networks that are not registered yet.
     *
     * Concurrent calls share one load per module, and a module whose load failed is loaded
     * again by the next call. When a module fails, the others still register and the call
     * rejects afterwards with one error that lists every failed module.
     */
    ensureLoaded: (networkSymbols: readonly NetworkSymbol[]) => Promise<void>;
};

export type StakingProductRepositoryDep = {
    stakingProductRepository: StakingProductRepository;
};

const NO_ADAPTERS: readonly StakingProductAdapter[] = [];

const getDeclaredSymbolsLabel = (module: StakingProductModule) => module.networkSymbols.join(', ');

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unknown error';

const isFailure = (failure: string | null): failure is string => failure !== null;

export const createStakingProductRepository = (
    deps: StakingProductRepositoryDeps,
): StakingProductRepository => {
    const adapterByProductId = new Map<StakingProductId, StakingProductAdapter>();
    const adaptersBySymbol = new Map<NetworkSymbol, readonly StakingProductAdapter[]>();
    const registeredModules = new Set<StakingProductModule>();
    const loadingModules = new Map<StakingProductModule, Promise<void>>();
    let adapters: readonly StakingProductAdapter[] = NO_ADAPTERS;

    const validateModuleAdapters = (
        module: StakingProductModule,
        moduleAdapters: readonly StakingProductAdapter[],
    ) => {
        const declaredSymbolsLabel = getDeclaredSymbolsLabel(module);
        const moduleProductIds = new Set<StakingProductId>();

        moduleAdapters.forEach(adapter => {
            const { id, networkSymbol } = adapter.descriptor;
            const result = stakingProductDescriptorSchema.safeParse(adapter.descriptor);

            if (!result.success) {
                throw new Error(
                    `Staking product ${id} has an invalid descriptor:\n${z.prettifyError(result.error)}`,
                );
            }

            if (adapterByProductId.has(id) || moduleProductIds.has(id)) {
                throw new Error(`Staking product ${id} is registered twice.`);
            }

            if (!module.networkSymbols.includes(networkSymbol)) {
                throw new Error(
                    `Staking product ${id} is served by a module declared for ${declaredSymbolsLabel}.`,
                );
            }

            moduleProductIds.add(id);
        });

        module.networkSymbols.forEach(networkSymbol => {
            const isServed = moduleAdapters.some(
                adapter => adapter.descriptor.networkSymbol === networkSymbol,
            );

            if (!isServed) {
                throw new Error(
                    `Staking product module for ${declaredSymbolsLabel} registered no product for ${networkSymbol}.`,
                );
            }
        });
    };

    const register = (
        module: StakingProductModule,
        moduleAdapters: readonly StakingProductAdapter[],
    ) => {
        validateModuleAdapters(module, moduleAdapters);

        moduleAdapters.forEach(adapter => {
            const { id, networkSymbol } = adapter.descriptor;

            adapterByProductId.set(id, adapter);
            adaptersBySymbol.set(networkSymbol, [
                ...(adaptersBySymbol.get(networkSymbol) ?? NO_ADAPTERS),
                adapter,
            ]);
        });
        adapters = Array.from(adapterByProductId.values());
        registeredModules.add(module);

        deps.onProductsRegistered(moduleAdapters);
    };

    const loadModule = (module: StakingProductModule): Promise<void> => {
        const loading = loadingModules.get(module);

        if (loading !== undefined) return loading;

        // Started from a resolved promise so that a loader throwing synchronously rejects too.
        const load = Promise.resolve()
            .then(() => module.load())
            .then(moduleAdapters => register(module, moduleAdapters))
            .finally(() => loadingModules.delete(module));

        loadingModules.set(module, load);

        return load;
    };

    const ensureLoaded = async (networkSymbols: readonly NetworkSymbol[]): Promise<void> => {
        const pendingModules = deps.productModules.filter(
            module =>
                !registeredModules.has(module) &&
                module.networkSymbols.some(networkSymbol => networkSymbols.includes(networkSymbol)),
        );
        const failures = await Promise.all(
            pendingModules.map(module =>
                loadModule(module).then(
                    (): string | null => null,
                    (error: unknown) =>
                        `${getDeclaredSymbolsLabel(module)}: ${getErrorMessage(error)}`,
                ),
            ),
        );
        const failedModules = failures.filter(isFailure);

        if (failedModules.length > 0) {
            throw new Error(`Staking product modules failed to load: ${failedModules.join('; ')}`);
        }
    };

    const get = (productId: StakingProductId): StakingProductAdapter => {
        const adapter = adapterByProductId.get(productId);

        if (!adapter) {
            throw new Error(`Staking product ${productId} is not registered.`);
        }

        return adapter;
    };

    const list = (): readonly StakingProductAdapter[] => adapters;

    const listBySymbol = (networkSymbol: NetworkSymbol): readonly StakingProductAdapter[] =>
        adaptersBySymbol.get(networkSymbol) ?? NO_ADAPTERS;

    const isSupportedSymbol = (networkSymbol: NetworkSymbol): boolean =>
        adaptersBySymbol.has(networkSymbol);

    return { get, list, listBySymbol, isSupportedSymbol, ensureLoaded };
};

export const injectStakingProductRepository = (services: any): StakingProductRepositoryDep => ({
    stakingProductRepository: services.staking.stakingProductRepository,
});
