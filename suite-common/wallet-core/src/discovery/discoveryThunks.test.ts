import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type DeviceRootState, deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect, {
    type StaticSessionId,
    UI_EVENTS,
    asDeviceUniquePath,
} from '@trezor/connect';
import { createMockDispatch, mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { prepareDiscoveryReducer } from './discoveryReducer';
import { updateDiscoveryMatcher } from './discoveryStateThunks';
import {
    type EndUnfinishedDiscoveryThunkDeps,
    type EndUnfinishedDiscoveryThunkState,
    type RunDiscoveryThunkDeps,
    type RunDiscoveryThunkState,
    applyDeviceStatesThunk,
    endUnfinishedDiscoveryThunk,
    runAdditionalDiscoveryThunk,
    runDiscoveryThunk,
} from './discoveryThunks';
import { accountsActions } from '../accounts/accountsActions';
import { blockchainInitialState } from '../blockchain/blockchainReducer';
import {
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '../settings/walletSettingsReducer';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, getDeviceState: jest.fn() },
    };
});

type State = DeviceRootState & WalletSettingsRootState;

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

const devicePath = asDeviceUniquePath('device-path');
const hiddenWallet = mockSuiteDevice({
    path: devicePath,
    instance: 1,
    connected: true,
    state: { staticSessionId: 'hidden-passphrase@device-id:1' },
    useEmptyPassphrase: false,
});
const statelessDevice = mockSuiteDevice({ path: devicePath, instance: 2, connected: true });

const initStore = (devices: TrezorDevice[], isAutoEjectEnabled = false) =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            device: deviceReducer,
            wallet: combineReducers({
                settings: (state = initialWalletSettingsState) => state,
            }),
        }),
        preloadedState: {
            device: {
                devices,
                buttonRequestsByPath: {},
            },
            wallet: {
                settings: { ...initialWalletSettingsState, isAutoEjectEnabled },
            },
        },
    }).services.store;

describe('applyDeviceStatesThunk', () => {
    it('authorizes the stateless device when an authorized wallet is listed first on the same path', async () => {
        const store = initStore([hiddenWallet, statelessDevice]);

        await store
            .dispatch(
                applyDeviceStatesThunk({
                    newDeviceState: { staticSessionId: 'standard@device-id:1' },
                    isAddingHiddenWallet: false,
                    devicePath,
                }),
            )
            .unwrap();

        const { devices } = store.getState().device;
        expect(devices.find(d => d.instance === 1)).toMatchObject({
            state: hiddenWallet.state,
            useEmptyPassphrase: false,
            remember: false,
        });
        expect(devices.find(d => d.instance === 2)).toMatchObject({
            state: { staticSessionId: 'standard@device-id:1' },
            useEmptyPassphrase: true,
            remember: true,
        });
    });

    // The wallet it is added next to starts with the opposite value to detect a mix-up.
    it.each([
        { isAutoEjectEnabled: false, siblingRemember: false, expectedRemember: true },
        { isAutoEjectEnabled: true, siblingRemember: true, expectedRemember: false },
    ])(
        'applies remember to the added wallet, not to the wallet it is added next to (auto eject: $isAutoEjectEnabled)',
        async ({ isAutoEjectEnabled, siblingRemember, expectedRemember }) => {
            const standardWallet = mockSuiteDevice({
                path: devicePath,
                instance: 1,
                connected: true,
                state: { staticSessionId: 'standard@device-id:1' },
                useEmptyPassphrase: true,
                remember: siblingRemember,
            });
            const store = initStore([standardWallet], isAutoEjectEnabled);

            await store
                .dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: { staticSessionId: 'hidden-passphrase@device-id:2' },
                        isAddingHiddenWallet: true,
                        devicePath,
                    }),
                )
                .unwrap();

            const { devices } = store.getState().device;
            expect(devices.find(d => d.instance === 1)).toMatchObject({
                remember: siblingRemember,
            });
            expect(devices.find(d => d.instance === 2)).toMatchObject({
                state: { staticSessionId: 'hidden-passphrase@device-id:2' },
                useEmptyPassphrase: false,
                remember: expectedRemember,
            });
        },
    );
});

const existingWalletState: StaticSessionId = 'standard@deviceid:1';
const existingWallet = mockSuiteDevice({
    path: devicePath,
    instance: 1,
    connected: true,
    state: { staticSessionId: existingWalletState },
    useEmptyPassphrase: true,
});

const createState = (
    discovery: DiscoveryStatus,
    selectedDevice: TrezorDevice = statelessDevice,
): RunDiscoveryThunkState => ({
    wallet: {
        accounts: [],
        blockchain: blockchainInitialState,
        discovery: { [devicePath]: discovery },
        settings: initialWalletSettingsState,
    },
    device: {
        devices: [existingWallet, statelessDevice],
        selectedDevice,
        buttonRequestsByPath: {},
    },
    persistentDeviceData: persistentDeviceDataInitialState,
    tokenDefinitions: tokenDefinitionsInitialState,
    networks: mockNetworksState([asNetworkSymbol('btc')]),
});

const createExtra = (): RunDiscoveryThunkDeps => ({
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
        reportSecurityCheck: jest.fn(),
    },
    thunks: { fetchAndSaveMetadata: jest.fn() },
});

describe('runDiscoveryThunk duplicates', () => {
    const runDiscovery = async (discovery: DiscoveryStatus) => {
        // The device returns the state of the wallet which is already in the list.
        jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: 'standard@deviceid:0' } },
        });
        const state = createState(discovery);
        const { actions, dispatch } = createMockDispatch({
            getState: () => state,
            extra: createExtra(),
        });

        await dispatch(runDiscoveryThunk({ device: statelessDevice }));

        return actions;
    };

    it('selects the existing wallet when a standard wallet is added twice', async () => {
        const actions = await runDiscovery({ status: 'starting', isAddingHiddenWallet: false });

        expect(actions).toContainEqual({
            type: updateDiscoveryMatcher.type,
            payload: { status: { status: 'complete' }, path: devicePath },
        });
        expect(actions).toContainEqual(deviceActions.selectDevice(existingWallet));
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: deviceActions.addAuthorizedDevice.type }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: deviceActions.setDeviceState.type }),
        );
    });

    it('asks the user what to do when a passphrase wallet is a duplicate', async () => {
        const actions = await runDiscovery({ status: 'starting', isAddingHiddenWallet: true });

        expect(actions).toContainEqual({
            type: updateDiscoveryMatcher.type,
            payload: {
                status: {
                    status: 'passphrase-duplicate',
                    duplicateDeviceStaticSessionId: existingWalletState,
                },
                path: devicePath,
            },
        });
        expect(actions).not.toContainEqual(deviceActions.selectDevice(existingWallet));
    });
});

describe('runAdditionalDiscoveryThunk', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('ignores progress events once the run has an outcome', async () => {
        const state = createState({ status: 'progress', total: 2, progress: 1 }, existingWallet);
        let onBundleProgress: ((event: unknown) => void) | undefined;
        jest.spyOn(TrezorConnect, 'on').mockImplementation(((
            event: string,
            listener: (payload: unknown) => void,
        ) => {
            if (event === UI_EVENTS.BUNDLE_PROGRESS) onBundleProgress = listener;
        }) as typeof TrezorConnect.on);
        jest.spyOn(TrezorConnect, 'off').mockImplementation(jest.fn());
        jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: existingWalletState } },
        });
        jest.spyOn(TrezorConnect, 'discoverAccounts').mockImplementation(() => {
            state.wallet.discovery[devicePath] = {
                status: 'failed',
                error: 'Device disconnected',
                errorCode: 'Device_Disconnected',
            };
            onBundleProgress?.({
                progress: 2,
                total: 2,
                response: {
                    index: 0,
                    symbol: 'btc',
                    type: 'normal',
                    path: "m/84'/0'/0'",
                    descriptor: 'xpub',
                    balance: '0',
                    availableBalance: '0',
                    empty: true,
                    last: true,
                    history: { total: 0, unconfirmed: 0 },
                },
            });

            return Promise.resolve({
                success: false,
                error: { message: 'Device disconnected', code: 'Device_Disconnected' },
            });
        });
        const { actions, dispatch } = createMockDispatch({
            getState: () => state,
            extra: createExtra(),
        });

        await dispatch(
            runAdditionalDiscoveryThunk({ staticSessionId: existingWalletState, trigger: 'retry' }),
        );

        expect(actions).toContainEqual(
            expect.objectContaining({ type: runAdditionalDiscoveryThunk.fulfilled.type }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({
                type: updateDiscoveryMatcher.type,
                payload: expect.objectContaining({
                    status: expect.objectContaining({ status: 'progress', progress: 2 }),
                }),
            }),
        );
    });
});

describe('runAdditionalDiscoveryThunk accounts', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Rediscovers the existing wallet, in which Connect finds the given account.
    const discoverAccount = async (
        account: object,
        state = createState({ status: 'progress', total: 1, progress: 0 }, existingWallet),
    ) => {
        let onBundleProgress: ((event: unknown) => void) | undefined;
        jest.spyOn(TrezorConnect, 'on').mockImplementation(((
            event: string,
            listener: (payload: unknown) => void,
        ) => {
            if (event === UI_EVENTS.BUNDLE_PROGRESS) onBundleProgress = listener;
        }) as typeof TrezorConnect.on);
        jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: existingWalletState } },
        });
        jest.spyOn(TrezorConnect, 'discoverAccounts').mockImplementation(() => {
            onBundleProgress?.({
                progress: 1,
                total: 1,
                response: { descriptor: 'xpub', history: {}, ...account },
            });

            return Promise.resolve({
                success: true,
                payload: { empty: 0, nonempty: 1, failed: 0 },
            });
        });
        const { actions, dispatch } = createMockDispatch({
            getState: () => state,
            extra: createExtra(),
        });

        await dispatch(
            runAdditionalDiscoveryThunk({ staticSessionId: existingWalletState, trigger: 'retry' }),
        );

        return actions.find(accountsActions.createAccount.match)?.payload.account;
    };

    it('gives a discovered account the type of the custom backend', async () => {
        const state = createState({ status: 'progress', total: 1, progress: 0 }, existingWallet);
        state.wallet.blockchain = {
            ...blockchainInitialState,
            eth: { ...blockchainInitialState.eth, backends: { selected: 'evm-rpc' } },
        };

        expect(await discoverAccount({ symbol: 'eth' }, state)).toMatchObject({
            backendType: 'evm-rpc',
        });
    });

    it("gives a discovered account the type of the network's default backend", async () => {
        expect(await discoverAccount({ symbol: 'xrp' })).toMatchObject({ backendType: 'ripple' });
    });

    it('keeps the error code of an account that failed to load', async () => {
        expect(
            await discoverAccount({ symbol: 'btc', failed: true, code: 'blockchain_link/connect' }),
        ).toMatchObject({ failed: true, errorCode: 'blockchain_link/connect' });
    });
});

describe('runAdditionalDiscoveryThunk load duration', () => {
    const discoveryReducer = prepareDiscoveryReducer(undefined);
    const deviceState = {
        success: true as const,
        payload: { state: { staticSessionId: existingWalletState } },
    };
    const allAccountsLoaded = {
        success: true as const,
        payload: { empty: 1, nonempty: 0, failed: 0 },
    };

    const setup = () => {
        const state = createState({ status: 'complete' }, existingWallet);
        const extra = createExtra();
        const mockDispatch = createMockDispatch({ getState: () => state, extra });
        const subscription = mockDispatch.onDispatch(action => {
            state.wallet.discovery = discoveryReducer(state.wallet.discovery, action);
        });
        jest.spyOn(TrezorConnect, 'on').mockImplementation(jest.fn());
        jest.spyOn(TrezorConnect, 'off').mockImplementation(jest.fn());

        return { ...mockDispatch, state, analytics: extra.services.analytics, subscription };
    };

    beforeEach(() => {
        jest.useFakeTimers({ now: 0 });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('reports the time spent loading accounts, leaving out the device preparation', async () => {
        const { dispatch, analytics, subscription } = setup();
        jest.mocked(TrezorConnect.getDeviceState).mockImplementation(() => {
            jest.setSystemTime(2_000);

            return Promise.resolve(deviceState);
        });
        jest.spyOn(TrezorConnect, 'discoverAccounts').mockImplementation(() => {
            jest.setSystemTime(6_000);

            return Promise.resolve(allAccountsLoaded);
        });

        await dispatch(
            runAdditionalDiscoveryThunk({
                staticSessionId: existingWalletState,
                trigger: 'coin-toggle',
            }),
        );
        subscription.unsubscribe();

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'complete', trigger: 'coin-toggle', durationMs: 4_000 },
        });
    });

    it('reports nothing more for a run that ended while the device was being prepared', async () => {
        const { dispatch, analytics, state, subscription } = setup();
        jest.mocked(TrezorConnect.getDeviceState).mockImplementation(() => {
            state.wallet.discovery = {
                [devicePath]: { status: 'cancelled', trigger: 'coin-toggle' },
            };

            return Promise.resolve(deviceState);
        });
        jest.spyOn(TrezorConnect, 'discoverAccounts').mockResolvedValue(allAccountsLoaded);

        await dispatch(
            runAdditionalDiscoveryThunk({
                staticSessionId: existingWalletState,
                trigger: 'coin-toggle',
            }),
        );
        subscription.unsubscribe();

        expect(analytics.report).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: 'accounts/discovery-result' }),
        );
    });
});

describe('endUnfinishedDiscoveryThunk', () => {
    const disconnected: Extract<DiscoveryStatus, { status: 'failed' }> = {
        status: 'failed',
        error: 'Device disconnected',
        errorCode: 'Device_Disconnected',
    };

    const endUnfinishedDiscovery = async (discovery: DiscoveryStatus) => {
        const { actions, dispatch } = createMockDispatch<
            EndUnfinishedDiscoveryThunkState,
            EndUnfinishedDiscoveryThunkDeps
        >({
            getState: () => ({
                wallet: { discovery: { [devicePath]: discovery }, accounts: [] },
                device: { devices: [], buttonRequestsByPath: {} },
            }),
            extra: { services: { analytics: mockAnalytics<AnalyticsSharedEvents>() } },
        });

        await dispatch(endUnfinishedDiscoveryThunk({ devicePath, status: disconnected }));

        return actions;
    };

    it('records the outcome of a run that is still in progress', async () => {
        const actions = await endUnfinishedDiscovery({
            status: 'progress',
            total: 10,
            progress: 1,
            trigger: 'device-connect',
        });

        expect(actions).toContainEqual({
            type: updateDiscoveryMatcher.type,
            payload: { status: disconnected, path: devicePath },
        });
    });

    it('leaves a passphrase outcome alone', async () => {
        const actions = await endUnfinishedDiscovery({
            status: 'passphrase-mismatch',
            trigger: 'add-wallet',
        });

        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: updateDiscoveryMatcher.type }),
        );
    });

    it('leaves a run that has already ended alone', async () => {
        const actions = await endUnfinishedDiscovery({
            status: 'cancelled',
            trigger: 'device-connect',
        });

        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: updateDiscoveryMatcher.type }),
        );
    });
});
