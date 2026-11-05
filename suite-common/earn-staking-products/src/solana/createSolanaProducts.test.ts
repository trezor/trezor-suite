import type { EthOrSolStats } from '@suite-common/earn-staking-api';
import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type CreateSolanaProductsDeps, createSolanaProducts } from './createSolanaProducts';

const stats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

const createProducts = (symbol: string) =>
    createSolanaProducts({
        networkSymbol: asNetworkSymbol(symbol),
        ...createMockDeps<CreateSolanaProductsDeps>({
            getStakingStats: () => Promise.resolve(stats),
        }),
    });

describe('createSolanaProducts', () => {
    it.each(['sol', 'dsol'])('builds the Everstake and the external product for %s', symbol => {
        const products = createProducts(symbol);

        expect(products.map(product => product.descriptor.id)).toEqual([
            `${symbol}:${symbol}:everstake:native`,
            `${symbol}:${symbol}:external:native`,
        ]);
        products.forEach(product => {
            expect(stakingProductDescriptorSchema.safeParse(product.descriptor).success).toBe(true);
        });
    });

    it('gives mainnet Everstake staking its message-system keys', () => {
        const [everstake] = createProducts('sol');

        expect(everstake?.descriptor.messageSystemFeatures).toEqual({
            stake: 'sol.staking.stake',
            unstake: 'sol.staking.unstake',
            withdraw: 'sol.staking.claim',
        });
    });

    it('gives devnet no message-system keys', () => {
        const [everstake] = createProducts('dsol');

        expect(everstake?.descriptor.messageSystemFeatures).toEqual({});
    });
});
