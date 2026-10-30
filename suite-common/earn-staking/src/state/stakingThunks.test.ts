import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { type QueryClient, commonQueryKeys } from '@suite-common/react-query';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
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
const sol = mockStakingProductDescriptor({ symbol: asNetworkSymbol('sol'), type: 'native' });
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
                listBySymbol: mock(symbol =>
                    adapters.filter(adapter => adapter.descriptor.symbol === symbol),
                ),
            }),
        }),
        queryClient,
    },
});

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
        staking: mockStakingState({ descriptors: [eth, sol] }),
        wallet: {
            accounts: [...accounts],
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
        staking: mockStakingState({ descriptors: [eth, sol] }),
        wallet: { accounts: [...accounts] },
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
        staking: mockStakingState({ descriptors: [eth, sol] }),
        wallet: { accounts: [ethAccount, solAccount, btcAccount] },
    };

    const run = async (params?: { symbol: ReturnType<typeof asNetworkSymbol> }) => {
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
        expect(await run({ symbol: asNetworkSymbol('sol') })).toEqual([solAccount.key]);
    });
});
