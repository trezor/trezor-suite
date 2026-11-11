import { type EthOrSolStats } from '@suite-common/earn-staking-api';
import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import {
    type CardanoStakingScenario,
    mockCardanoStakingAccount,
    mockSolanaStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createStakingProductsCompositionRoot } from './createStakingProductsCompositionRoot';
import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './products/solana/everstake-native/messageSystemFeatures';
import {
    type SolanaEverstakeNativeProductDeps,
    createSolanaEverstakeNativeProduct,
} from './products/solana/everstake-native/product';
import { createSolanaExternalNativeProduct } from './products/solana/external-native/product';
import { everstakeProvider } from './providers/everstake';

describe('createStakingProductsCompositionRoot', () => {
    const adapters = createStakingProductsCompositionRoot();

    it('registers the Ethereum, Solana, Cardano and Tron products for mainnet testnet networks', () => {
        expect(adapters.map(adapter => adapter.descriptor.id)).toEqual([
            'eth:eth:everstake:pooled',
            'thod:thod:everstake:pooled',
            'sol:sol:everstake:native',
            'sol:sol:external:native',
            'dsol:dsol:everstake:native',
            'dsol:dsol:external:native',
            'ada:ada:everstake:native',
            'ada:ada:fivebinaries:native',
            'ada:ada:external:native',
            'trx:trx:curated:native',
        ]);
    });

    it('registers descriptors that match the contract', () => {
        adapters.forEach(adapter => {
            expect(stakingProductDescriptorSchema.safeParse(adapter.descriptor).success).toBe(true);
        });
    });
});

const stats: EthOrSolStats = { symbol: 'sol', apy: 6.24 };

type CreateSolanaProductsDeps = SolanaEverstakeNativeProductDeps;

const createProducts = (symbol: string) => [
    createSolanaEverstakeNativeProduct({
        networkSymbol: asNetworkSymbol(symbol),
        provider: everstakeProvider,
        messageSystemFeatures:
            symbol === 'sol' ? SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES : {},
        ...createMockDeps<CreateSolanaProductsDeps>({
            getStakingStats: () => Promise.resolve(stats),
        }),
    }),
    createSolanaExternalNativeProduct({
        networkSymbol: asNetworkSymbol(symbol),
        managedProviders: [everstakeProvider],
    }),
];

describe('Solana products', () => {
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

    it('splits an account stake between the Everstake and the external product', () => {
        const account = mockSolanaStakingAccount('everstakeAndExternal');

        expect(
            createProducts('sol').map(
                product =>
                    product.getPosition({ account, productInfo: null, transactions: [] })?.balances
                        .staked,
            ),
        ).toEqual(['5000000000', '10000000000']);
    });

    it('gives devnet no message-system keys', () => {
        const [everstake] = createProducts('dsol');

        expect(everstake?.descriptor.messageSystemFeatures).toEqual({});
    });
});

describe('Cardano products', () => {
    const cardanoProducts = createStakingProductsCompositionRoot().filter(
        product => product.descriptor.networkSymbol === 'ada',
    );

    it('gives every Cardano product the network message-system keys', () => {
        expect(cardanoProducts.map(product => product.descriptor.messageSystemFeatures)).toEqual([
            {
                stake: 'ada.staking.stake',
                unstake: 'ada.staking.unstake',
                claim: 'ada.staking.claim',
                vote: 'ada.staking.vote',
            },
            {
                unstake: 'ada.staking.unstake',
                claim: 'ada.staking.claim',
                vote: 'ada.staking.vote',
            },
            {
                unstake: 'ada.staking.unstake',
                claim: 'ada.staking.claim',
                vote: 'ada.staking.vote',
            },
        ]);
    });

    it.each<{ scenario: CardanoStakingScenario; owner: string | null }>([
        { scenario: 'notDelegated', owner: null },
        { scenario: 'everstake', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeNoRewards', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeOtherPool', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeMissingDrep', owner: 'ada:ada:everstake:native' },
        { scenario: 'everstakeAbstainDrep', owner: 'ada:ada:everstake:native' },
        { scenario: 'fiveBinaries', owner: 'ada:ada:fivebinaries:native' },
        { scenario: 'externalPool', owner: 'ada:ada:external:native' },
    ])('gives the $scenario stake key to one product at most', ({ scenario, owner }) => {
        const account = mockCardanoStakingAccount(scenario);

        expect(
            cardanoProducts.flatMap(product => {
                const position = product.getPosition({
                    account,
                    productInfo: null,
                    transactions: [],
                });

                return position === null ? [] : [position.productId];
            }),
        ).toEqual(owner === null ? [] : [owner]);
    });
});
