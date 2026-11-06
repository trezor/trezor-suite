import type { StakingProductModule } from '@suite-common/earn-staking-common';
import { asNetworkSymbols } from '@trezor/network-module-types';

/**
 * The staking products, one lazy module per network family.
 *
 * Nothing here imports a product statically, so a family's product code ships in its own chunk,
 * which the product repository loads only once one of the family's networks is enabled.
 * The staking API endpoints a family reads and its future operation kit follow into that chunk
 * once nothing in the boot set imports them statically.
 */
export const createStakingProductsCompositionRoot = (): readonly StakingProductModule[] => [
    {
        networkSymbols: asNetworkSymbols(['eth', 'thod']),
        load: async () => {
            const { createEthereumStakingProducts } = await import(
                /* webpackChunkName: "staking-ethereum" */ './products/ethereum/createEthereumStakingProducts'
            );

            return createEthereumStakingProducts();
        },
    },
    {
        networkSymbols: asNetworkSymbols(['sol', 'dsol']),
        load: async () => {
            const { createSolanaStakingProducts } = await import(
                /* webpackChunkName: "staking-solana" */ './products/solana/createSolanaStakingProducts'
            );

            return createSolanaStakingProducts();
        },
    },
    {
        networkSymbols: asNetworkSymbols(['ada']),
        load: async () => {
            const { createCardanoStakingProducts } = await import(
                /* webpackChunkName: "staking-cardano" */ './products/cardano/createCardanoStakingProducts'
            );

            return createCardanoStakingProducts();
        },
    },
    {
        networkSymbols: asNetworkSymbols(['trx']),
        load: async () => {
            const { createTronStakingProducts } = await import(
                /* webpackChunkName: "staking-tron" */ './products/tron/createTronStakingProducts'
            );

            return createTronStakingProducts();
        },
    },
];
