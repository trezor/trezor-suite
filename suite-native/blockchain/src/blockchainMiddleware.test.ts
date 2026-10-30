import type {
    refreshStakingProductInfoThunk as RefreshStakingProductInfoThunk,
    syncStakingPositionsThunk as SyncStakingPositionsThunk,
    SyncStakingPositionsThunkDeps,
    SyncStakingPositionsThunkState,
} from '@suite-common/earn-staking';
import { mockStakingServices, mockStakingState } from '@suite-common/earn-staking/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type {
    accountsActions as AccountsActions,
    changeNetworks as ChangeNetworks,
} from '@suite-common/wallet-core';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import type TrezorConnectType from '@trezor/connect';
import { type StaticSessionId } from '@trezor/connect';

import type { blockchainMiddleware as BlockchainMiddleware } from './blockchainMiddleware';
import type * as BlockchainThunks from './blockchainThunks';
import type * as PolledNetworkSync from './polledNetworkSync';

type BlockchainModules = {
    accountsActions: typeof AccountsActions;
    changeNetworks: typeof ChangeNetworks;
    blockchainMiddleware: typeof BlockchainMiddleware;
    polledNetworkSync: typeof PolledNetworkSync;
    thunks: typeof BlockchainThunks;
    refreshStakingProductInfoThunk: typeof RefreshStakingProductInfoThunk;
    syncStakingPositionsThunk: typeof SyncStakingPositionsThunk;
    TrezorConnect: typeof TrezorConnectType;
};

// The scheduled timeouts live in polledNetworkSync's module scope, so every test gets fresh modules.
const loadModules = () => {
    let modules: BlockchainModules | undefined;
    jest.isolateModules(() => {
        modules = {
            accountsActions: require('@suite-common/wallet-core').accountsActions,
            changeNetworks: require('@suite-common/wallet-core').changeNetworks,
            blockchainMiddleware: require('./blockchainMiddleware').blockchainMiddleware,
            polledNetworkSync: require('./polledNetworkSync'),
            thunks: require('./blockchainThunks'),
            refreshStakingProductInfoThunk: require('@suite-common/earn-staking')
                .refreshStakingProductInfoThunk,
            syncStakingPositionsThunk: require('@suite-common/earn-staking')
                .syncStakingPositionsThunk,
            TrezorConnect: require('@trezor/connect').default,
        };
    });

    return modules!;
};

const SELECTED_DEVICE_STATE: StaticSessionId = 'selectedAddress@device_id:0';
const OTHER_DEVICE_STATE: StaticSessionId = 'otherAddress@device_id:0';

type InitStoreParams = {
    symbol: NetworkSymbol;
    deviceState?: StaticSessionId;
};

const initStore = ({ symbol, deviceState = SELECTED_DEVICE_STATE }: InitStoreParams) => {
    const {
        accountsActions,
        changeNetworks,
        blockchainMiddleware,
        polledNetworkSync,
        thunks,
        refreshStakingProductInfoThunk,
        syncStakingPositionsThunk,
        TrezorConnect,
    } = loadModules();
    // Failing the account lookup keeps the test independent of the account refresh itself.
    jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
        success: false,
        error: { message: 'offline', code: 'Backend_Error' },
    });

    const device = mockSuiteDevice({ state: { staticSessionId: SELECTED_DEVICE_STATE } });
    const account = mockWalletAccount({ symbol, deviceState });
    const { store } = createTestCompositionRoot<
        BlockchainThunks.SyncAccountsWithBlockchainThunkDeps & SyncStakingPositionsThunkDeps,
        BlockchainThunks.SyncAccountsWithBlockchainThunkState & SyncStakingPositionsThunkState
    >({
        middleware: [blockchainMiddleware],
        preloadedState: {
            device: { devices: [device], selectedDevice: device },
            wallet: { accounts: [account], transactions: { transactions: {} } },
            staking: mockStakingState(),
        },
        services: () => ({
            analytics: mockNativeAnalytics(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
            staking: mockStakingServices(),
        }),
    }).services;

    const updateAccount = () => store.dispatch(accountsActions.updateAccount(account));
    const changeEnabledNetworks = () => store.dispatch(changeNetworks([symbol], [symbol]));
    const countActions = (type: string) =>
        store.getActions().filter(action => action.type === type).length;
    const getSyncCount = () => countActions(thunks.syncAccountsWithBlockchainThunk.pending.type);
    const getStakingSyncCount = () => countActions(syncStakingPositionsThunk.pending.type);
    const getStakingRefreshCount = () => countActions(refreshStakingProductInfoThunk.pending.type);

    return {
        updateAccount,
        changeEnabledNetworks,
        getSyncCount,
        getStakingSyncCount,
        getStakingRefreshCount,
        interval: polledNetworkSync.POLLED_NETWORK_SYNC_INTERVAL_MS,
    };
};

const ada = asNetworkSymbol('ada');
const btc = asNetworkSymbol('btc');
const eth = asNetworkSymbol('eth');

describe('blockchainMiddleware', () => {
    describe('polled network sync', () => {
        // The first load transforms the whole wallet-core graph, which can exceed the default test
        // timeout; later isolated loads reuse the transform cache.
        beforeAll(() => {
            loadModules();
        }, 30_000);

        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
            jest.restoreAllMocks();
        });

        it('keeps syncing cardano accounts of the selected device', async () => {
            const { updateAccount, getSyncCount, interval } = initStore({ symbol: ada });

            updateAccount();
            await jest.advanceTimersByTimeAsync(interval);
            expect(getSyncCount()).toBe(1);

            await jest.advanceTimersByTimeAsync(interval);
            expect(getSyncCount()).toBe(2);
        });

        it('schedules only one sync for repeated account updates', async () => {
            const { updateAccount, getSyncCount, interval } = initStore({ symbol: ada });

            updateAccount();
            updateAccount();
            await jest.advanceTimersByTimeAsync(interval);

            expect(getSyncCount()).toBe(1);
        });

        it.each<[string, InitStoreParams]>([
            ['a network whose backend pushes updates', { symbol: btc }],
            [
                'cardano accounts of a device that is not selected',
                { symbol: ada, deviceState: OTHER_DEVICE_STATE },
            ],
        ])('does not sync %s', async (_description, params) => {
            const { updateAccount, getSyncCount, interval } = initStore(params);

            updateAccount();
            await jest.advanceTimersByTimeAsync(interval * 2);

            expect(getSyncCount()).toBe(0);
        });
    });

    describe('staking', () => {
        beforeAll(() => {
            loadModules();
        }, 30_000);

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('syncs the staking positions of an updated account on a network with a product', () => {
            const { updateAccount, getStakingSyncCount } = initStore({ symbol: eth });

            updateAccount();

            expect(getStakingSyncCount()).toBe(1);
        });

        it('skips the staking sync for an account on a network without a product', () => {
            const { updateAccount, getStakingSyncCount } = initStore({ symbol: btc });

            updateAccount();

            expect(getStakingSyncCount()).toBe(0);
        });

        it('refreshes the staking product info when the enabled networks change', () => {
            const { changeEnabledNetworks, getStakingRefreshCount } = initStore({ symbol: btc });

            changeEnabledNetworks();

            expect(getStakingRefreshCount()).toBe(1);
        });
    });
});
