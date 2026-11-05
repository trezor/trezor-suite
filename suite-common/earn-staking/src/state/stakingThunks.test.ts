import {
    type StakingProductAdapter,
    stakingProviderIdSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClient, commonQueryKeys } from '@suite-common/react-query';
import { testMocks } from '@suite-common/test-utils';
import { initialWalletSettingsState, transactionsInitialState } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { getCachedStakingProductInfo } from './stakingProductInfoQuery';
import { stakingActions } from './stakingReducer';
import {
    type RefreshStakingProductInfoThunkDeps,
    type RefreshStakingProductInfoThunkState,
    type SyncStakingPositionsThunkDeps,
    type SyncStakingPositionsThunkState,
    refreshStakingProductInfoThunk,
    syncAllStakingPositionsThunk,
    syncStakingPositionsThunk,
} from './stakingThunks';
import {
    mockStakingProductRepository,
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '../../mocks';

const eth = mockStakingProductDescriptor();
const sol = mockStakingProductDescriptor({ networkSymbol: asNetworkSymbol('sol'), type: 'native' });
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

const createAdapter = (
    descriptor = eth,
    overrides: Partial<StakingProductAdapter> = {},
): StakingProductAdapter =>
    mockStakingProductAdapter({
        descriptor,
        fetchProductInfo: mock<StakingProductAdapter['fetchProductInfo']>(() =>
            Promise.resolve(mockStakingProductInfo()),
        ),
        ...overrides,
    });

const createDeps = (
    adapters: readonly StakingProductAdapter[],
    queryClient: QueryClient = mockStakingQueryClient(),
) => ({
    services: {
        staking: mockStakingServices({
            stakingProductRepository: mockStakingProductRepository({
                get: mock(productId => {
                    const adapter = adapters.find(item => item.descriptor.id === productId);

                    if (!adapter) throw new Error(`Unexpected product ${productId}`);

                    return adapter;
                }),
                listBySymbol: mock(networkSymbol =>
                    adapters.filter(adapter => adapter.descriptor.networkSymbol === networkSymbol),
                ),
            }),
        }),
        queryClient,
    },
});

const waitFor = async (condition: () => boolean) => {
    for (let attempt = 0; attempt < 50 && !condition(); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

const seedInfo = (queryClient: QueryClient, productId: string, updatedAt: number) =>
    queryClient.setQueryData(
        commonQueryKeys.stakingProductInfo(productId),
        mockStakingProductInfo(),
        { updatedAt },
    );

describe('refreshStakingProductInfoThunk', () => {
    const createState = (
        accounts: readonly Account[] = [ethAccount, solAccount, btcAccount],
        enabledNetworks: NetworkSymbol[] = [asNetworkSymbol('eth')],
    ): RefreshStakingProductInfoThunkState => ({
        earn: { staking: mockStakingState({ descriptors: [eth, sol] }) },
        wallet: {
            accounts: [...accounts],
            transactions: transactionsInitialState,
            settings: { ...initialWalletSettingsState, enabledNetworks },
        },
    });

    const run = async (
        state: RefreshStakingProductInfoThunkState,
        extra: RefreshStakingProductInfoThunkDeps,
        params?: { force: boolean },
    ) => {
        const getState = () => state;
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await refreshStakingProductInfoThunk(params)(dispatch, getState, extra);

        return actions;
    };

    const syncedAccountKeys = (actions: readonly unknown[]) =>
        actions
            .filter(stakingActions.positionsSynced.match)
            .map(action => action.payload.accountKey);

    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('fetches and caches the info of products on enabled networks only', async () => {
        const ethAdapter = createAdapter(eth);
        const solAdapter = createAdapter(sol);
        const extra = createDeps([ethAdapter, solAdapter]);

        await run(createState(), extra);

        expect(ethAdapter.fetchProductInfo).toHaveBeenCalledTimes(1);
        expect(solAdapter.fetchProductInfo).not.toHaveBeenCalled();
        expect(getCachedStakingProductInfo(extra.services.queryClient, eth.id)).toEqual(
            mockStakingProductInfo(),
        );
        expect(getCachedStakingProductInfo(extra.services.queryClient, sol.id)).toBeNull();
    });

    it('re-syncs the positions of a network whose info arrived, once', async () => {
        const actions = await run(
            createState(undefined, [asNetworkSymbol('eth'), asNetworkSymbol('sol')]),
            createDeps([createAdapter(eth), createAdapter(sol)]),
        );

        expect(syncedAccountKeys(actions)).toEqual([ethAccount.key, solAccount.key]);
    });

    it('re-syncs a network without waiting for the info of another', async () => {
        const solAdapter = createAdapter(sol, {
            fetchProductInfo: mock<StakingProductAdapter['fetchProductInfo']>(
                () => new Promise(() => {}),
            ),
        });
        const extra = createDeps([createAdapter(eth), solAdapter]);
        const state = createState(undefined, [asNetworkSymbol('eth'), asNetworkSymbol('sol')]);
        const getState = () => state;
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        refreshStakingProductInfoThunk()(dispatch, getState, extra);

        await waitFor(() => syncedAccountKeys(actions).length > 0);

        expect(syncedAccountKeys(actions)).toEqual([ethAccount.key]);
        expect(solAdapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('passes the query abort signal to the product', async () => {
        const adapter = createAdapter(eth);

        await run(createState(), createDeps([adapter]));

        expect(adapter.fetchProductInfo).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
        });
    });

    it('skips info fetched less than five minutes ago unless forced', async () => {
        const adapter = createAdapter(eth);
        const queryClient = mockStakingQueryClient();
        seedInfo(queryClient, eth.id, Date.now() - 60_000);
        const extra = createDeps([adapter], queryClient);

        await run(createState(), extra);
        expect(adapter.fetchProductInfo).not.toHaveBeenCalled();

        await run(createState(), extra, { force: true });
        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('fetches again once the info is older than five minutes', async () => {
        const adapter = createAdapter(eth);
        const queryClient = mockStakingQueryClient();
        seedInfo(queryClient, eth.id, Date.now() - 6 * 60_000);

        await run(createState(), createDeps([adapter], queryClient));

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('does not re-sync when a forced fetch returns the same info', async () => {
        const queryClient = mockStakingQueryClient();
        seedInfo(queryClient, eth.id, Date.now() - 60_000);

        const actions = await run(createState(), createDeps([createAdapter(eth)], queryClient), {
            force: true,
        });

        expect(syncedAccountKeys(actions)).toEqual([]);
    });

    it('joins a fetch that is already running', async () => {
        const adapter = createAdapter(eth);
        const extra = createDeps([adapter]);
        const state = createState();
        const getState = () => state;
        const { dispatch } = createMockDispatch({ getState, extra });

        await Promise.all([
            refreshStakingProductInfoThunk()(dispatch, getState, extra),
            refreshStakingProductInfoThunk()(dispatch, getState, extra),
        ]);

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('warns about a failure without throwing or reporting an error', async () => {
        const adapter = createAdapter(eth, {
            fetchProductInfo: mock<StakingProductAdapter['fetchProductInfo']>(() =>
                Promise.reject(new Error('offline')),
            ),
        });
        const extra = createDeps([adapter]);

        const actions = await run(createState(), extra);

        expect(syncedAccountKeys(actions)).toEqual([]);
        expect(getCachedStakingProductInfo(extra.services.queryClient, eth.id)).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('offline'));
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('syncStakingPositionsThunk', () => {
    const createState = (
        accounts: readonly Account[] = [ethAccount, btcAccount],
    ): SyncStakingPositionsThunkState => ({
        earn: { staking: mockStakingState({ descriptors: [eth, sol] }) },
        wallet: { accounts: [...accounts], transactions: transactionsInitialState },
    });

    const run = async (
        state: SyncStakingPositionsThunkState,
        extra: SyncStakingPositionsThunkDeps,
        accountKey = ethAccount.key,
    ) => {
        const getState = () => state;
        const { actions, dispatch } = createMockDispatch({ getState, extra });
        const result = await syncStakingPositionsThunk({ accountKey })(dispatch, getState, extra);

        return { actions, result };
    };

    it('stores the positions the adapters of the account network report', async () => {
        const position = mockStakingPosition();
        const adapter = createAdapter(eth, {
            getPosition: mock<StakingProductAdapter['getPosition']>(() => position),
        });
        const { actions } = await run(createState(), createDeps([adapter, createAdapter(sol)]));

        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: null,
            transactions: [],
        });
        expect(actions.filter(stakingActions.positionsSynced.match)).toEqual([
            stakingActions.positionsSynced({ accountKey: ethAccount.key, positions: [position] }),
        ]);
    });

    it('passes the cached product info to the adapter', async () => {
        const info = mockStakingProductInfo({ rate: 4.2 });
        const adapter = createAdapter(eth);
        const queryClient = mockStakingQueryClient({ productInfo: { [eth.id]: info } });

        await run(createState(), createDeps([adapter], queryClient));

        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: info,
            transactions: [],
        });
    });

    it('passes the stored transactions of the account to the adapter', async () => {
        const transaction = testMocks.getWalletTransaction({
            descriptor: ethAccount.descriptor,
            symbol: ethAccount.symbol,
        });
        const adapter = createAdapter(eth);
        const state: SyncStakingPositionsThunkState = {
            ...createState(),
            wallet: {
                accounts: [ethAccount],
                transactions: {
                    ...transactionsInitialState,
                    transactions: { [ethAccount.key]: [transaction] },
                },
            },
        };

        await run(state, createDeps([adapter]));

        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: null,
            transactions: [transaction],
        });
    });

    it('clears the positions when no adapter reports one', async () => {
        const { actions } = await run(createState(), createDeps([createAdapter(eth)]));

        expect(actions.filter(stakingActions.positionsSynced.match)).toEqual([
            stakingActions.positionsSynced({ accountKey: ethAccount.key, positions: [] }),
        ]);
    });

    it('does nothing for an account that is gone', async () => {
        const adapter = createAdapter(eth);
        const { actions } = await run(createState([btcAccount]), createDeps([adapter]));

        expect(adapter.getPosition).not.toHaveBeenCalled();
        expect(actions.filter(stakingActions.positionsSynced.match)).toEqual([]);
    });

    it('drops the position of a product whose adapter throws and keeps the others', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const lido = mockStakingProductDescriptor({
            providerId: stakingProviderIdSchema.parse('lido'),
        });
        const position = mockStakingPosition({ productId: lido.id });
        const failing = createAdapter(eth, {
            getPosition: mock<StakingProductAdapter['getPosition']>(() => {
                throw new TypeError('0xd523 is not a pool');
            }),
        });
        const working = createAdapter(lido, {
            getPosition: mock<StakingProductAdapter['getPosition']>(() => position),
        });
        const { actions, result } = await run(createState(), createDeps([failing, working]));

        expect(result.type).toBe(syncStakingPositionsThunk.fulfilled.type);
        expect(actions.filter(stakingActions.positionsSynced.match)).toEqual([
            stakingActions.positionsSynced({ accountKey: ethAccount.key, positions: [position] }),
        ]);
        expect(warn).toHaveBeenCalledWith(`Staking position for ${eth.id} failed: TypeError`);
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('0xd523'));

        warn.mockRestore();
    });

    it('rejects a position that does not match the contract', async () => {
        const adapter = createAdapter(eth, {
            getPosition: mock<StakingProductAdapter['getPosition']>(() => ({
                ...mockStakingPosition(),
                status: 'frozen' as never,
            })),
        });
        const { actions, result } = await run(createState(), createDeps([adapter]));

        expect(result.type).toBe(syncStakingPositionsThunk.rejected.type);
        expect(actions.filter(stakingActions.positionsSynced.match)).toEqual([]);
    });
});

describe('syncAllStakingPositionsThunk', () => {
    const state: SyncStakingPositionsThunkState = {
        earn: { staking: mockStakingState({ descriptors: [eth, sol] }) },
        wallet: {
            accounts: [ethAccount, solAccount, btcAccount],
            transactions: transactionsInitialState,
        },
    };

    const run = async (params?: { networkSymbol: ReturnType<typeof asNetworkSymbol> }) => {
        const extra = createDeps([createAdapter(eth), createAdapter(sol)]);
        const getState = () => state;
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await syncAllStakingPositionsThunk(params)(dispatch, getState, extra);

        return actions
            .filter(stakingActions.positionsSynced.match)
            .map(action => action.payload.accountKey);
    };

    it('syncs every account of a network with a product', async () => {
        expect(await run()).toEqual([ethAccount.key, solAccount.key]);
    });

    it('limits the sync to one network', async () => {
        expect(await run({ networkSymbol: asNetworkSymbol('sol') })).toEqual([solAccount.key]);
    });
});
