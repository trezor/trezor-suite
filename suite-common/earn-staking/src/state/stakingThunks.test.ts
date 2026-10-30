import {
    type StakingProductAdapter,
    type StakingProductInfo,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

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
import { mockStakingProductRepository, mockStakingServices, mockStakingState } from '../../mocks';

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

const createDeps = (adapters: readonly StakingProductAdapter[]) => ({
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
    },
});

describe('refreshStakingProductInfoThunk', () => {
    const createState = (
        staking = mockStakingState({ descriptors: [eth, sol] }),
        enabledNetworks = [asNetworkSymbol('eth')],
    ): RefreshStakingProductInfoThunkState => ({
        staking,
        wallet: {
            accounts: [ethAccount, btcAccount],
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

    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('fetches the info of products on enabled networks only', async () => {
        const ethAdapter = createAdapter(eth);
        const solAdapter = createAdapter(sol);
        const actions = await run(createState(), createDeps([ethAdapter, solAdapter]));

        expect(ethAdapter.fetchProductInfo).toHaveBeenCalledTimes(1);
        expect(solAdapter.fetchProductInfo).not.toHaveBeenCalled();
        expect(actions.filter(stakingActions.productInfoRequested.match)).toEqual([
            stakingActions.productInfoRequested({ productId: eth.id }),
        ]);
        expect(actions.filter(stakingActions.productInfoFetched.match)).toEqual([
            expect.objectContaining({
                payload: expect.objectContaining({
                    productId: eth.id,
                    info: mockStakingProductInfo(),
                }),
            }),
        ]);
    });

    it('re-syncs the positions of the fetched product network', async () => {
        const ethAdapter = createAdapter(eth);
        const actions = await run(createState(), createDeps([ethAdapter, createAdapter(sol)]));

        expect(ethAdapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: null,
        });
        expect(actions.filter(stakingActions.positionsSynced.match)).toEqual([
            stakingActions.positionsSynced({ accountKey: ethAccount.key, positions: [] }),
        ]);
    });

    it('skips info fetched less than five minutes ago unless forced', async () => {
        const fresh = stakingReducer(
            mockStakingState({ descriptors: [eth] }),
            stakingActions.productInfoFetched({
                productId: eth.id,
                info: mockStakingProductInfo(),
                fetchedAt: Date.now() - 60_000,
            }),
        );
        const adapter = createAdapter(eth);

        await run(createState(fresh), createDeps([adapter]));
        expect(adapter.fetchProductInfo).not.toHaveBeenCalled();

        await run(createState(fresh), createDeps([adapter]), { force: true });
        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('fetches again once the info is older than five minutes', async () => {
        const stale = stakingReducer(
            mockStakingState({ descriptors: [eth] }),
            stakingActions.productInfoFetched({
                productId: eth.id,
                info: mockStakingProductInfo(),
                fetchedAt: Date.now() - 6 * 60_000,
            }),
        );
        const adapter = createAdapter(eth);

        await run(createState(stale), createDeps([adapter]));

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
    });

    it('does not fetch a product whose info is already loading', async () => {
        const loading = stakingReducer(
            mockStakingState({ descriptors: [eth] }),
            stakingActions.productInfoRequested({ productId: eth.id }),
        );
        const adapter = createAdapter(eth);

        await run(createState(loading), createDeps([adapter]));

        expect(adapter.fetchProductInfo).not.toHaveBeenCalled();
    });

    it('records a failure without throwing', async () => {
        const adapter = createAdapter(eth, {
            fetchProductInfo: mock<StakingProductAdapter['fetchProductInfo']>(() =>
                Promise.reject(new Error('offline')),
            ),
        });
        const actions = await run(createState(), createDeps([adapter]));

        expect(actions.filter(stakingActions.productInfoFailed.match)).toEqual([
            stakingActions.productInfoFailed({ productId: eth.id, error: 'offline' }),
        ]);
        expect(actions.filter(stakingActions.productInfoFetched.match)).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('offline'));
    });
});

describe('syncStakingPositionsThunk', () => {
    const createState = (
        accounts: readonly Account[] = [ethAccount, btcAccount],
        staking = mockStakingState({ descriptors: [eth, sol] }),
    ): SyncStakingPositionsThunkState => ({ staking, wallet: { accounts: [...accounts] } });

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

    it('passes the current product info to the adapter', async () => {
        const info: StakingProductInfo = mockStakingProductInfo({ rate: 4.2 });
        const staking = stakingReducer(
            mockStakingState({ descriptors: [eth] }),
            stakingActions.productInfoFetched({ productId: eth.id, info, fetchedAt: 1 }),
        );
        const adapter = createAdapter(eth);

        await run(createState([ethAccount], staking), createDeps([adapter]));

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
