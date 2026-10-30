import {
    type StakingProductAdapter,
    type StakingProductId,
    type StakingProductInfo,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { commonQueryKeys } from '@suite-common/react-query';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import type { Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asGetter, mock } from '@trezor/dependency-injection';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { getCachedStakingProductInfo } from './stakingProductInfoQuery';
import { stakingActions, stakingReducer } from './stakingReducer';
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

type DepsFixture = {
    accounts?: readonly Account[];
    enabledNetworks?: readonly NetworkSymbol[];
    productInfo?: Partial<Record<StakingProductId, StakingProductInfo>>;
};

const createDeps = (
    adapters: readonly StakingProductAdapter[],
    {
        accounts = [ethAccount, btcAccount],
        enabledNetworks = [eth.symbol],
        productInfo,
    }: DepsFixture = {},
) => ({
    services: {
        queryClient: mockStakingQueryClient({ productInfo }),
        staking: mockStakingServices({
            getAccounts: asGetter(() => accounts),
            getAccountByKey: asGetter(
                accountKey => accounts.find(account => account.key === accountKey) ?? null,
            ),
            getEnabledNetworks: asGetter(() => enabledNetworks),
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
    },
});

describe('refreshStakingProductInfoThunk', () => {
    const FETCHED_AT = 1_777_000_000_000;

    const initStore = (adapters: readonly StakingProductAdapter[]) => {
        const { services } = createTestCompositionRoot<
            RefreshStakingProductInfoThunkDeps,
            RefreshStakingProductInfoThunkState
        >({
            services: () => createDeps(adapters).services,
            reducer: { staking: stakingReducer },
            preloadedState: { staking: mockStakingState({ descriptors: [eth, sol] }) },
        });

        return { store: services.store, queryClient: services.queryClient };
    };

    const setNow = (now: number) => jest.setSystemTime(now);

    beforeEach(() => {
        // Only the clock is faked, the store and the query client keep resolving on real timers.
        jest.useFakeTimers({
            now: FETCHED_AT,
            doNotFake: [
                'nextTick',
                'setImmediate',
                'clearImmediate',
                'queueMicrotask',
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
            ],
        });
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('fetches the info of products on enabled networks only', async () => {
        const ethAdapter = createAdapter(eth);
        const solAdapter = createAdapter(sol);
        const { store, queryClient } = initStore([ethAdapter, solAdapter]);

        await store.dispatch(refreshStakingProductInfoThunk());

        expect(ethAdapter.fetchProductInfo).toHaveBeenCalledTimes(1);
        expect(solAdapter.fetchProductInfo).not.toHaveBeenCalled();
        expect(getCachedStakingProductInfo(queryClient, eth.id)).toEqual(mockStakingProductInfo());
        expect(queryClient.getQueryState(commonQueryKeys.stakingProductInfo(sol.id))).toBe(
            undefined,
        );
    });

    it('re-syncs the positions of the fetched product network', async () => {
        const ethAdapter = createAdapter(eth);
        const { store } = initStore([ethAdapter, createAdapter(sol)]);

        await store.dispatch(refreshStakingProductInfoThunk());

        expect(ethAdapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: mockStakingProductInfo(),
        });
    });

    it('skips info fetched less than five minutes ago unless forced', async () => {
        const adapter = createAdapter(eth);
        const { store } = initStore([adapter]);

        await store.dispatch(refreshStakingProductInfoThunk());
        setNow(FETCHED_AT + 60_000);
        await store.dispatch(refreshStakingProductInfoThunk());
        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);

        await store.dispatch(refreshStakingProductInfoThunk({ force: true }));
        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(2);
    });

    it('fetches again once the info is older than five minutes', async () => {
        const adapter = createAdapter(eth);
        const { store } = initStore([adapter]);

        await store.dispatch(refreshStakingProductInfoThunk());
        setNow(FETCHED_AT + 6 * 60_000);
        await store.dispatch(refreshStakingProductInfoThunk());

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(2);
    });

    it('does not fetch a product whose info is already loading', async () => {
        const adapter = createAdapter(eth);
        const { store } = initStore([adapter]);

        await Promise.all([
            store.dispatch(refreshStakingProductInfoThunk()),
            store.dispatch(refreshStakingProductInfoThunk({ force: true })),
        ]);

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('records a failure and keeps the last info', async () => {
        const fetchProductInfo = mock<StakingProductAdapter['fetchProductInfo']>(() =>
            Promise.resolve(mockStakingProductInfo()),
        );
        const adapter = createAdapter(eth, { fetchProductInfo });
        const { store, queryClient } = initStore([adapter]);

        await store.dispatch(refreshStakingProductInfoThunk());
        jest.mocked(adapter.getPosition).mockClear();
        fetchProductInfo.mockRejectedValueOnce(new Error('offline'));
        await store.dispatch(refreshStakingProductInfoThunk({ force: true }));

        const queryState = queryClient.getQueryState(commonQueryKeys.stakingProductInfo(eth.id));

        expect(queryState?.status).toBe('error');
        expect(queryState?.error).toEqual(new Error('offline'));
        expect(queryState?.data).toEqual(mockStakingProductInfo());
        expect(adapter.getPosition).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('offline'));
    });
});

describe('syncStakingPositionsThunk', () => {
    const createState = (): SyncStakingPositionsThunkState => ({
        staking: mockStakingState({ descriptors: [eth, sol] }),
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
        const info: StakingProductInfo = mockStakingProductInfo({ rate: 4.2 });
        const adapter = createAdapter(eth);

        await run(
            createState(),
            createDeps([adapter], { accounts: [ethAccount], productInfo: { [eth.id]: info } }),
        );

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
        const { actions } = await run(
            createState(),
            createDeps([adapter], { accounts: [btcAccount] }),
        );

        expect(adapter.getPosition).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('does nothing for an account on a network without a product', async () => {
        const adapter = createAdapter(eth);
        const { actions } = await run(createState(), createDeps([adapter]), btcAccount.key);

        expect(actions).toEqual([]);
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
    const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });
    const state: SyncStakingPositionsThunkState = {
        staking: mockStakingState({ descriptors: [eth, sol] }),
    };

    const run = async (params?: { symbol: ReturnType<typeof asNetworkSymbol> }) => {
        const extra = createDeps([createAdapter(eth), createAdapter(sol)], {
            accounts: [ethAccount, solAccount, btcAccount],
        });
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
