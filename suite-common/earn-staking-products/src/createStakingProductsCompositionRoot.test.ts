import {
    type EthOrSolStats,
    defaultEarnStakingWorkerBaseUrl,
    earnStakingWorkerBaseUrl,
} from '@suite-common/earn-staking-api';
import {
    type StakingProductAdapter,
    stakingProductDescriptorSchema,
} from '@suite-common/earn-staking-common';
import { QueryClient, createQueryClient } from '@suite-common/react-query';
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

const createAdapters = (queryClient = createQueryClient({ shouldRefetchOnEvents: false })) =>
    createStakingProductsCompositionRoot({ queryClient });

describe('createStakingProductsCompositionRoot', () => {
    const adapters = createAdapters();

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

    it('gives each Everstake pool the minimum stake of its own deployment', () => {
        expect(
            adapters
                .filter(({ descriptor }) => descriptor.type === 'pooled')
                .map(({ descriptor }) => [descriptor.id, descriptor.limits.minStakeAmount]),
        ).toEqual([
            ['eth:eth:everstake:pooled', '10000000000000000'],
            ['thod:thod:everstake:pooled', '100000000000000000'],
        ]);
    });

    it('registers descriptors that match the contract', () => {
        adapters.forEach(adapter => {
            expect(stakingProductDescriptorSchema.safeParse(adapter.descriptor).success).toBe(true);
        });
    });
});

const SECONDS_IN_DAY = 24 * 60 * 60;

const SHARED_ENDPOINT_RESPONSES: Record<string, unknown> = {
    '/eth/stats': { symbol: 'eth', apy: 3.08, nextRewardPayout: 0 },
    '/eth/validators-queue': {
        addingDelay: SECONDS_IN_DAY,
        activationTime: SECONDS_IN_DAY,
        withdrawTime: SECONDS_IN_DAY,
        exitTime: SECONDS_IN_DAY,
    },
    '/sol/stats': { symbol: 'sol', apy: 6.24 },
};

const EVERY_ENDPOINT_PATH = [
    '/ada/pools?limit=1000',
    '/eth/stats',
    '/eth/validators-queue',
    '/sol/stats',
    '/trx/stats',
];

describe('staking endpoint requests', () => {
    let fetchSpy: jest.SpiedFunction<typeof fetch>;

    const getPath = (input: RequestInfo | URL) =>
        new Request(input).url.replace(defaultEarnStakingWorkerBaseUrl, '');

    const getRequestedPaths = () => fetchSpy.mock.calls.map(([input]) => getPath(input)).toSorted();

    const refreshEveryProductInfo = (adapters: readonly StakingProductAdapter[]) =>
        Promise.allSettled(adapters.map(adapter => adapter.fetchProductInfo({})));

    const getAdapter = (adapters: readonly StakingProductAdapter[], productId: string) => {
        const adapter = adapters.find(({ descriptor }) => descriptor.id === productId);

        if (!adapter) throw new Error(`Missing product ${productId}`);

        return adapter;
    };

    beforeEach(() => {
        earnStakingWorkerBaseUrl.set(defaultEarnStakingWorkerBaseUrl);
        fetchSpy = jest
            .spyOn(globalThis, 'fetch')
            .mockImplementation(input =>
                Promise.resolve(Response.json(SHARED_ENDPOINT_RESPONSES[getPath(input)] ?? {})),
            );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('fetches each endpoint once while every product refreshes its info', async () => {
        await refreshEveryProductInfo(createAdapters());

        expect(getRequestedPaths()).toEqual(EVERY_ENDPOINT_PATH);
    });

    it('fetches the shared endpoints again on the next refresh', async () => {
        const adapters = createAdapters();

        await refreshEveryProductInfo(adapters);
        await refreshEveryProductInfo(adapters);

        expect(getRequestedPaths()).toEqual(EVERY_ENDPOINT_PATH.flatMap(path => [path, path]));
    });

    it('leaves the retries to the product info query', async () => {
        fetchSpy.mockImplementation(() =>
            Promise.resolve(new Response('Bad gateway', { status: 502 })),
        );
        const retryingQueryClient = new QueryClient({
            defaultOptions: { queries: { retry: 3, retryDelay: 0 } },
        });

        await refreshEveryProductInfo(createAdapters(retryingQueryClient));

        expect(getRequestedPaths()).toEqual(EVERY_ENDPOINT_PATH);
    });

    it('stops only the aborted product, leaving the shared request to the other', async () => {
        const adapters = createAdapters();
        const abortController = new AbortController();

        const ethereumInfo = getAdapter(adapters, 'eth:eth:everstake:pooled').fetchProductInfo({
            abortSignal: abortController.signal,
        });
        const hoodiInfo = getAdapter(adapters, 'thod:thod:everstake:pooled').fetchProductInfo({});
        abortController.abort(new Error('Left the page'));

        await expect(ethereumInfo).rejects.toThrow('Left the page');
        await expect(hoodiInfo).resolves.toEqual({
            rate: null,
            entryPeriodDays: 2,
            exitPeriodDays: 2,
            rewardPeriodDays: null,
            nextRewardAt: null,
            targets: [],
        });
        expect(getRequestedPaths()).toEqual(['/eth/stats', '/eth/validators-queue']);
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
    const cardanoProducts = createAdapters().filter(
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

describe('mobile platform support', () => {
    it('manages the Everstake Ethereum and Solana products and shows every other one read-only', () => {
        const supportByProduct = Object.fromEntries(
            createAdapters().map(
                ({ descriptor }) => [descriptor.id, descriptor.platforms.mobile] as const,
            ),
        );

        expect(supportByProduct).toEqual({
            'eth:eth:everstake:pooled': { access: 'manage' },
            'thod:thod:everstake:pooled': { access: 'manage' },
            'sol:sol:everstake:native': { access: 'manage' },
            'dsol:dsol:everstake:native': { access: 'manage' },
            'sol:sol:external:native': { access: 'read-only' },
            'dsol:dsol:external:native': { access: 'read-only' },
            'ada:ada:everstake:native': { access: 'read-only' },
            'ada:ada:fivebinaries:native': { access: 'read-only' },
            'ada:ada:external:native': { access: 'read-only' },
            'trx:trx:curated:native': { access: 'read-only' },
        });
    });
});
