import { z } from 'zod';

import {
    type StakingProductAdapter,
    type StakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type StakingProductRepositoryDeps = {
    adapters: readonly StakingProductAdapter[];
};

export type StakingProductRepository = {
    get: (productId: StakingProductId) => StakingProductAdapter;
    list: () => readonly StakingProductAdapter[];
    listBySymbol: (symbol: NetworkSymbol) => readonly StakingProductAdapter[];
    isSupportedSymbol: (symbol: NetworkSymbol) => boolean;
};

export type StakingProductRepositoryDep = {
    stakingProductRepository: StakingProductRepository;
};

const NO_ADAPTERS: readonly StakingProductAdapter[] = [];

export const createStakingProductRepository = (
    deps: StakingProductRepositoryDeps,
): StakingProductRepository => {
    const adapterByProductId = new Map<StakingProductId, StakingProductAdapter>();
    const adaptersBySymbol = new Map<NetworkSymbol, StakingProductAdapter[]>();

    deps.adapters.forEach(adapter => {
        const { id, symbol } = adapter.descriptor;
        const result = stakingProductDescriptorSchema.safeParse(adapter.descriptor);

        if (!result.success) {
            throw new Error(
                `Staking product ${id} has an invalid descriptor:\n${z.prettifyError(result.error)}`,
            );
        }

        if (adapterByProductId.has(id)) {
            throw new Error(`Staking product ${id} is registered twice.`);
        }

        adapterByProductId.set(id, adapter);
        adaptersBySymbol.set(symbol, [...(adaptersBySymbol.get(symbol) ?? []), adapter]);
    });

    const adapters: readonly StakingProductAdapter[] = Array.from(adapterByProductId.values());

    const get = (productId: StakingProductId): StakingProductAdapter => {
        const adapter = adapterByProductId.get(productId);

        if (!adapter) {
            throw new Error(`Staking product ${productId} is not registered.`);
        }

        return adapter;
    };

    const list = (): readonly StakingProductAdapter[] => adapters;

    const listBySymbol = (symbol: NetworkSymbol): readonly StakingProductAdapter[] =>
        adaptersBySymbol.get(symbol) ?? NO_ADAPTERS;

    const isSupportedSymbol = (symbol: NetworkSymbol): boolean => adaptersBySymbol.has(symbol);

    return { get, list, listBySymbol, isSupportedSymbol };
};

export const injectStakingProductRepository = (services: any): StakingProductRepositoryDep => ({
    stakingProductRepository: services.staking.stakingProductRepository,
});
