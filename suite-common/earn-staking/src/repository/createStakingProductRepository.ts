import {
    type StakingProductAdapter,
    type StakingProductId,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { z } from '@trezor/zod';

export type StakingProductRepositoryDeps = {
    adapters: readonly StakingProductAdapter[];
};

export type StakingProductRepository = {
    get: (productId: StakingProductId) => StakingProductAdapter;
    list: () => readonly StakingProductAdapter[];
    listBySymbol: (networkSymbol: NetworkSymbol) => readonly StakingProductAdapter[];
    isSupportedSymbol: (networkSymbol: NetworkSymbol) => boolean;
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
        const { id, networkSymbol } = adapter.descriptor;
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
        adaptersBySymbol.set(networkSymbol, [
            ...(adaptersBySymbol.get(networkSymbol) ?? []),
            adapter,
        ]);
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

    const listBySymbol = (networkSymbol: NetworkSymbol): readonly StakingProductAdapter[] =>
        adaptersBySymbol.get(networkSymbol) ?? NO_ADAPTERS;

    const isSupportedSymbol = (networkSymbol: NetworkSymbol): boolean =>
        adaptersBySymbol.has(networkSymbol);

    return { get, list, listBySymbol, isSupportedSymbol };
};

export const injectStakingProductRepository = (services: any): StakingProductRepositoryDep => ({
    stakingProductRepository: services.staking.stakingProductRepository,
});
