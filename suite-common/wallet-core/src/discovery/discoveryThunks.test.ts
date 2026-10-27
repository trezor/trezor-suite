import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type DeviceRootState, deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockFetchAndSaveMetadata } from '@suite-common/metadata-types/mocks';
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
    type DiscoverAccountsProgress,
    type StaticSessionId,
    UI_EVENTS,
    type UiEventBundleProgress,
    asDeviceUniquePath,
} from '@trezor/connect';
import {
    type MockDispatch,
    createMockDispatch,
    mockActionType,
    mockReducer,
} from '@trezor/redux-utils/mocks';

import { discoveryActions } from './discoveryActions';
import { prepareDiscoveryReducer } from './discoveryReducer';
import {
    type RunAdditionalDiscoveryThunkDeps,
    type RunAdditionalDiscoveryThunkState,
    type RunDiscoveryThunkDeps,
    type RunDiscoveryThunkState,
    applyDeviceStatesThunk,
    cancelDiscoveryThunk,
    endUnfinishedDiscoveryThunk,
    runAdditionalDiscoveryThunk,
    runDiscoveryThunk,
    startOrRestartDiscoveryThunk,
} from './discoveryThunks';
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
        default: {
            ...actual.default,
            cancel: jest.fn(),
            discoverAccounts: jest.fn(),
            getDeviceState: jest.fn(),
            off: jest.fn(),
            on: jest.fn(),
        },
    };
});

type TestState = RunDiscoveryThunkState & RunAdditionalDiscoveryThunkState;
type TestExtra = RunDiscoveryThunkDeps & RunAdditionalDiscoveryThunkDeps;

const devicePath = asDeviceUniquePath('device-path');
const staticSessionId: StaticSessionId = 'wallet@device:0';
const discoveryReducer = prepareDiscoveryReducer(undefined);
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

const createDevice = (): TrezorDevice =>
    mockSuiteDevice({
        path: devicePath,
        state: { staticSessionId },
        connected: true,
        available: true,
    });

// A device that has not been authorized yet, which is what `runDiscoveryThunk` starts from.
const createStatelessDevice = (): TrezorDevice =>
    mockSuiteDevice({ path: devicePath, connected: true, available: true });

const createState = (discovery: DiscoveryStatus, device = createDevice()): TestState => ({
    wallet: {
        accounts: [],
        blockchain: blockchainInitialState,
        discovery: { [devicePath]: discovery },
        settings: initialWalletSettingsState,
    },
    device: {
        devices: [device],
        selectedDevice: device,
        buttonRequestsByPath: {},
    },
    persistentDeviceData: persistentDeviceDataInitialState,
    tokenDefinitions: tokenDefinitionsInitialState,
    networks: mockNetworksState([]),
});

const createExtra = (): TestExtra => ({
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
        reportSecurityCheck: jest.fn(),
    },
    thunks: { fetchAndSaveMetadata: mockFetchAndSaveMetadata() },
});

/**
 * Runs the thunks against the given state, applying every dispatched discovery and device action to
 * it the way the store would, so that a run finds the call id it recorded, the status it set and the
 * wallet it registered.
 */
const run = async (
    state: TestState,
    act: (dispatch: MockDispatch<TestState, TestExtra>['dispatch']) => unknown,
) => {
    const { actions, dispatch, onDispatch } = createMockDispatch<TestState, TestExtra>({
        // A new root object on every read, like the store after each update, so that selectors
        // memoized on the root state do not return results from before the last update.
        getState: () => ({ ...state }),
        extra: createExtra(),
    });
    const reducing = onDispatch(action => {
        state.wallet.discovery = discoveryReducer(state.wallet.discovery, action);
        state.device = deviceReducer(state.device, action);
    });

    try {
        await act(dispatch);
    } finally {
        reducing.unsubscribe();
    }

    return actions;
};

const userCancelledResult = {
    success: false as const,
    error: { message: 'USER_UI_CANCEL', code: 'Method_Cancel' as const },
};
const backendFailedResult = {
    success: false as const,
    error: { message: 'Backend disconnected', code: 'Backend_Disconnected' as const },
};
const completedResult = { success: true as const, payload: { empty: 0, nonempty: 1, failed: 0 } };
const deviceCancelledResult = {
    success: false as const,
    error: { message: 'Action cancelled by user', code: 'Failure_ActionCancelled' as const },
};
const deviceDisconnectedResult = {
    success: false as const,
    error: { message: 'Device disconnected', code: 'Device_Disconnected' as const },
};
const runCallId = 'c0ffee00-0000-4000-8000-000000000001';
const replacementRun: DiscoveryStatus = {
    status: 'starting',
    trigger: 'device-check',
    callId: 'c0ffee00-0000-4000-8000-000000000002',
};

const getDiscoveryUpdates = (actions: unknown[]) =>
    actions.filter(discoveryActions.updateDiscovery.match).map(action => action.payload.status);

const getDiscoveredUpdates = (actions: unknown[]) =>
    actions.filter(deviceActions.setDiscovered.match).map(action => action.payload);

const getDiscoveryStarts = (actions: unknown[]) =>
    actions.filter(discoveryActions.startDiscovery.match).map(action => action.payload);

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
        success: true,
        payload: { state: { staticSessionId } },
    });
});

describe(runDiscoveryThunk.name, () => {
    it('records the call id it passes to Connect, so that a cancel can target this run only', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(completedResult);

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        const callId = getDiscoveryUpdates(actions)[0]?.callId;
        expect(callId).toEqual(expect.any(String));
        expect(TrezorConnect.getDeviceState).toHaveBeenCalledWith(
            expect.objectContaining({ callId }),
        );
        expect(TrezorConnect.discoverAccounts).toHaveBeenCalledWith(
            expect.objectContaining({ callId }),
        );
    });

    it('completes the run when account discovery succeeds', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(completedResult);

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).toContainEqual({ status: 'complete' });
    });

    it('does not write the interruption of a cancelled run over the run that replaced it', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = { [devicePath]: replacementRun };

            return Promise.resolve(userCancelledResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).not.toContainEqual(
            expect.objectContaining({ status: 'failed' }),
        );
    });

    it('ignores the result of a run that was replaced while its Connect call was finishing', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = { [devicePath]: replacementRun };

            return Promise.resolve(completedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).not.toContainEqual(
            expect.objectContaining({ status: 'complete' }),
        );
    });

    it('marks the run as failed, keeping the retry, when the device cancels account discovery', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(deviceCancelledResult);

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).toContainEqual({
            status: 'failed',
            error: 'Action cancelled by user',
            errorCode: 'Failure_ActionCancelled',
        });
    });

    it('marks the wallet as not discovered when its run was already ended by a disconnect', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = {
                [devicePath]: {
                    ...state.wallet.discovery[devicePath],
                    status: 'failed',
                    errorCode: 'Device_Disconnected',
                },
            };

            return Promise.resolve(deviceDisconnectedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveredUpdates(actions)).toContainEqual({
            staticSessionId,
            success: false,
        });
    });

    it('marks the run as failed when account discovery fails for another reason', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(backendFailedResult);

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).toContainEqual({
            status: 'failed',
            error: 'Backend disconnected',
            errorCode: 'Backend_Disconnected',
        });
    });
});

describe(`${runDiscoveryThunk.name} with a newer run`, () => {
    it('leaves the wallet flag to the newer run when a replaced run fails late', async () => {
        const state = createState(
            { status: 'starting', trigger: 'device-connect' },
            createStatelessDevice(),
        );
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = { [devicePath]: { ...replacementRun, status: 'complete' } };

            return Promise.resolve(deviceDisconnectedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createStatelessDevice() })),
        );

        expect(getDiscoveredUpdates(actions)).toEqual([]);
    });
});

describe(`${runDiscoveryThunk.name} adding a new hidden wallet`, () => {
    const emptyPassphraseState: StaticSessionId = 'empty-passphrase@device:0';

    const createHiddenWalletDevice = () =>
        mockSuiteDevice({
            path: devicePath,
            connected: true,
            available: true,
            useEmptyPassphrase: false,
        });

    const createHiddenWalletState = () => ({
        ...createState(
            { status: 'starting', trigger: 'add-wallet', isAddingHiddenWallet: true },
            createHiddenWalletDevice(),
        ),
        networks: mockNetworksState([asNetworkSymbol('btc')]),
    });

    const nonemptyAccountEvent: UiEventBundleProgress<DiscoverAccountsProgress>['payload'] = {
        progress: 100,
        total: 100,
        response: {
            symbol: 'btc',
            type: 'normal',
            index: 0,
            path: "m/84'/0'/0'",
            backendType: 'blockbook',
            descriptor: 'zpubNonempty',
            balance: '1000',
            availableBalance: '1000',
            empty: false,
            history: { total: 1, unconfirmed: 0 },
            failed: false,
            last: true,
        },
    };

    const emitBundleProgress = (event: typeof nonemptyAccountEvent) =>
        jest
            .mocked(TrezorConnect.on)
            .mock.calls.filter(([eventName]) => eventName === UI_EVENTS.BUNDLE_PROGRESS)
            .forEach(([, handler]) => (handler as (payload: typeof event) => void)(event));

    beforeEach(() => {
        jest.mocked(TrezorConnect.getDeviceState)
            .mockReset()
            .mockResolvedValueOnce({ success: true, payload: { state: { staticSessionId } } })
            .mockResolvedValueOnce({
                success: true,
                payload: { state: { staticSessionId: emptyPassphraseState } },
            })
            .mockResolvedValueOnce({ success: true, payload: { state: { staticSessionId } } });
    });

    it('completes a wallet that has a nonempty account', async () => {
        const state = createHiddenWalletState();
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            emitBundleProgress(nonemptyAccountEvent);

            return Promise.resolve(completedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createHiddenWalletDevice() })),
        );

        expect(TrezorConnect.cancel).not.toHaveBeenCalled();
        expect(getDiscoveryUpdates(actions)).toContainEqual({ status: 'complete' });
    });

    it('completes a wallet whose accounts are all empty once its passphrase is confirmed', async () => {
        const state = createHiddenWalletState();
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue({
            success: true,
            payload: { empty: 1, nonempty: 0, failed: 0 },
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createHiddenWalletDevice() })),
        );

        expect(TrezorConnect.cancel).not.toHaveBeenCalled();
        expect(getDiscoveryUpdates(actions)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: 'confirm-empty-passphrase' }),
                { status: 'complete' },
            ]),
        );
    });

    it('continues when the empty passphrase check fails', async () => {
        const state = createHiddenWalletState();
        jest.mocked(TrezorConnect.getDeviceState)
            .mockReset()
            .mockResolvedValueOnce({ success: true, payload: { state: { staticSessionId } } })
            .mockResolvedValueOnce({
                success: false,
                error: { message: 'Device busy', code: 'Device_CallInProgress' },
            });
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            emitBundleProgress(nonemptyAccountEvent);

            return Promise.resolve(completedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createHiddenWalletDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).toContainEqual({ status: 'complete' });
    });

    it('stops when the wallet is forgotten during account discovery', async () => {
        const state = createHiddenWalletState();
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            emitBundleProgress(nonemptyAccountEvent);
            state.device = { ...state.device, devices: [] };

            return Promise.resolve(completedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runDiscoveryThunk({ device: createHiddenWalletDevice() })),
        );

        expect(getDiscoveryUpdates(actions)).not.toContainEqual({ status: 'complete' });
    });
});

describe(runAdditionalDiscoveryThunk.name, () => {
    it('records the call id it passes to Connect, so that a cancel can target this run only', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(completedResult);

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        const callId = getDiscoveryStarts(actions)[0]?.callId;
        expect(callId).toEqual(expect.any(String));
        expect(TrezorConnect.getDeviceState).toHaveBeenCalledWith(
            expect.objectContaining({ callId }),
        );
        expect(TrezorConnect.discoverAccounts).toHaveBeenCalledWith(
            expect.objectContaining({ callId }),
        );
    });

    it('does not write the interruption of a cancelled run over the run that replaced it', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = { [devicePath]: replacementRun };

            return Promise.resolve(userCancelledResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([]);
    });

    it('ignores the result of a run that was replaced while its Connect call was finishing', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = { [devicePath]: replacementRun };

            return Promise.resolve(completedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([]);
    });

    it('marks the run as failed, keeping the retry, when the device cancels account discovery', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(deviceCancelledResult);

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([
            {
                status: 'failed',
                error: 'Action cancelled by user',
                errorCode: 'Failure_ActionCancelled',
            },
        ]);
        expect(getDiscoveredUpdates(actions)).toEqual([{ staticSessionId, success: false }]);
    });

    it('marks the wallet as not discovered when its run was already ended by a disconnect', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = {
                [devicePath]: {
                    ...state.wallet.discovery[devicePath],
                    status: 'failed',
                    errorCode: 'Device_Disconnected',
                },
            };

            return Promise.resolve(deviceDisconnectedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([]);
        expect(getDiscoveredUpdates(actions)).toEqual([{ staticSessionId, success: false }]);
    });

    it('keeps the wallet discovered when its run is cancelled', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = {
                [devicePath]: { ...state.wallet.discovery[devicePath], status: 'cancelled' },
            };

            return Promise.resolve(userCancelledResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveredUpdates(actions)).toEqual([]);
    });

    it('marks the run as failed instead of leaving it running when it throws', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockRejectedValue(new Error('Unexpected'));

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([
            { status: 'failed', error: 'Unexpected', errorCode: 'Failure_UnknownCode' },
        ]);
        expect(getDiscoveredUpdates(actions)).toEqual([{ staticSessionId, success: false }]);
    });

    it('leaves the wallet flag to the newer run when a replaced run fails late', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockImplementation(() => {
            state.wallet.discovery = { [devicePath]: { ...replacementRun, status: 'complete' } };

            return Promise.resolve(deviceDisconnectedResult);
        });

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveredUpdates(actions)).toEqual([]);
    });

    it('marks the run as failed when account discovery fails for another reason', async () => {
        const state = createState({ status: 'complete', trigger: 'device-connect' });
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(backendFailedResult);

        const actions = await run(state, dispatch =>
            dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([
            {
                status: 'failed',
                error: 'Backend disconnected',
                errorCode: 'Backend_Disconnected',
            },
        ]);
    });
});

describe(cancelDiscoveryThunk.name, () => {
    it('interrupts only the Connect call of the cancelled run, not the runs of other devices', async () => {
        const state = createState({
            status: 'progress',
            total: 10,
            progress: 1,
            trigger: 'device-connect',
            callId: runCallId,
        });

        const actions = await run(state, dispatch =>
            dispatch(cancelDiscoveryThunk(createDevice())),
        );

        expect(TrezorConnect.cancel).toHaveBeenCalledWith({
            reason: 'USER_UI_CANCEL',
            callId: runCallId,
        });
        expect(getDiscoveryUpdates(actions)).toEqual([{ status: 'cancelled' }]);
    });

    it('does not touch Connect when the run has not made a Connect call yet', async () => {
        const state = createState({
            status: 'starting',
            trigger: 'add-wallet',
            isAddingHiddenWallet: true,
        });

        const actions = await run(state, dispatch =>
            dispatch(cancelDiscoveryThunk(createDevice())),
        );

        expect(TrezorConnect.cancel).not.toHaveBeenCalled();
        expect(getDiscoveryUpdates(actions)).toEqual([{ status: 'cancelled' }]);
    });
});

describe(startOrRestartDiscoveryThunk.name, () => {
    it('does not start another run over a run that is still in progress', async () => {
        const state = createState({
            status: 'progress',
            total: 10,
            progress: 1,
            trigger: 'device-connect',
        });

        const actions = await run(state, dispatch =>
            dispatch(startOrRestartDiscoveryThunk({ trigger: 'coin-toggle' })),
        );

        expect(getDiscoveryStarts(actions)).toEqual([]);
    });

    it('starts a new run once the previous run has ended', async () => {
        const state = createState({ status: 'failed', trigger: 'device-connect' });

        const actions = await run(state, dispatch =>
            dispatch(startOrRestartDiscoveryThunk({ trigger: 'retry' })),
        );

        expect(getDiscoveryStarts(actions)).toEqual([
            expect.objectContaining({ path: devicePath, trigger: 'retry' }),
        ]);
    });
});

describe('applyDeviceStatesThunk', () => {
    type ApplyDeviceStatesState = DeviceRootState & WalletSettingsRootState;

    const hiddenWallet = mockSuiteDevice({
        path: devicePath,
        instance: 1,
        connected: true,
        state: { staticSessionId: 'hidden-passphrase@device-id:1' },
        useEmptyPassphrase: false,
    });
    const statelessDevice = mockSuiteDevice({ path: devicePath, instance: 2, connected: true });

    const initStore = (devices: TrezorDevice[], isAutoEjectEnabled = false) =>
        createTestCompositionRoot<void, ApplyDeviceStatesState>({
            reducer: combineReducers({
                device: deviceReducer,
                wallet: combineReducers({
                    settings: (settingsState = initialWalletSettingsState) => settingsState,
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

describe(`${runDiscoveryThunk.name} duplicates`, () => {
    const existingWalletState: StaticSessionId = 'standard@device-id:1';
    const existingWallet = mockSuiteDevice({
        path: devicePath,
        instance: 1,
        connected: true,
        state: { staticSessionId: existingWalletState },
        useEmptyPassphrase: true,
    });
    const statelessDevice = mockSuiteDevice({ path: devicePath, instance: 2, connected: true });

    const createDuplicateState = (discovery: DiscoveryStatus): TestState => ({
        ...createState(discovery, statelessDevice),
        device: {
            devices: [existingWallet, statelessDevice],
            selectedDevice: statelessDevice,
            buttonRequestsByPath: {},
        },
        networks: mockNetworksState([asNetworkSymbol('btc')]),
    });

    const runDiscovery = (discovery: DiscoveryStatus) => {
        // The device returns the state of the wallet which is already in the list.
        jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: 'standard@device-id:0' } },
        });

        return run(createDuplicateState(discovery), dispatch =>
            dispatch(runDiscoveryThunk({ device: statelessDevice })),
        );
    };

    it('selects the existing wallet when a standard wallet is added twice', async () => {
        const actions = await runDiscovery({ status: 'starting', isAddingHiddenWallet: false });

        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery({ status: 'complete' }, devicePath),
        );
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

        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery(
                {
                    status: 'passphrase-duplicate',
                    duplicateDeviceStaticSessionId: existingWalletState,
                },
                devicePath,
            ),
        );
        expect(actions).not.toContainEqual(deviceActions.selectDevice(existingWallet));
    });
});

describe(endUnfinishedDiscoveryThunk.name, () => {
    const disconnected: Extract<DiscoveryStatus, { status: 'failed' }> = {
        status: 'failed',
        error: 'Device disconnected',
        errorCode: 'Device_Disconnected',
    };

    it('records the outcome of a run that is still in progress', async () => {
        const state = createState({
            status: 'progress',
            total: 10,
            progress: 1,
            trigger: 'device-connect',
        });

        const actions = await run(state, dispatch =>
            dispatch(endUnfinishedDiscoveryThunk({ devicePath, status: disconnected })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([disconnected]);
    });

    it('leaves a run that has already ended alone', async () => {
        const state = createState({ status: 'cancelled', trigger: 'device-connect' });

        const actions = await run(state, dispatch =>
            dispatch(endUnfinishedDiscoveryThunk({ devicePath, status: disconnected })),
        );

        expect(getDiscoveryUpdates(actions)).toEqual([]);
    });
});
