import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type { accountsActions as AccountsActions } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type TrezorConnectType from '@trezor/connect';
import { type StaticSessionId } from '@trezor/connect';

import type { blockchainMiddleware as BlockchainMiddleware } from './blockchainMiddleware';
import type * as BlockchainThunks from './blockchainThunks';
import type * as PolledNetworkSync from './polledNetworkSync';

type BlockchainModules = {
    accountsActions: typeof AccountsActions;
    blockchainMiddleware: typeof BlockchainMiddleware;
    polledNetworkSync: typeof PolledNetworkSync;
    thunks: typeof BlockchainThunks;
    TrezorConnect: typeof TrezorConnectType;
};

// The scheduled timeouts live in polledNetworkSync's module scope, so every test gets fresh modules.
const loadModules = () => {
    let modules: BlockchainModules | undefined;
    jest.isolateModules(() => {
        modules = {
            accountsActions: require('@suite-common/wallet-core').accountsActions,
            blockchainMiddleware: require('./blockchainMiddleware').blockchainMiddleware,
            polledNetworkSync: require('./polledNetworkSync'),
            thunks: require('./blockchainThunks'),
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
    const { accountsActions, blockchainMiddleware, polledNetworkSync, thunks, TrezorConnect } =
        loadModules();
    // Failing the account lookup keeps the test independent of the account refresh itself.
    jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
        success: false,
        error: { message: 'offline', code: 'Backend_Error' },
    });

    const device = mockSuiteDevice({ state: { staticSessionId: SELECTED_DEVICE_STATE } });
    const account = mockWalletAccount({ symbol, deviceState });
    const store = createTestStore({
        extra: {},
        middleware: [blockchainMiddleware],
        preloadedState: {
            device: { devices: [device], selectedDevice: device },
            wallet: { accounts: [account], transactions: { transactions: {} } },
        },
    });

    const updateAccount = () => store.dispatch(accountsActions.updateAccount(account));
    const getSyncCount = () =>
        store
            .getActions()
            .filter(({ type }) => type === thunks.syncAccountsWithBlockchainThunk.pending.type)
            .length;

    return {
        updateAccount,
        getSyncCount,
        interval: polledNetworkSync.POLLED_NETWORK_SYNC_INTERVAL_MS,
    };
};

const ada = asNetworkSymbol('ada');
const btc = asNetworkSymbol('btc');

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
});
