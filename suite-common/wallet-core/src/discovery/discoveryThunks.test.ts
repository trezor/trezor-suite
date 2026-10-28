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
import TrezorConnect, { type StaticSessionId, asDeviceUniquePath } from '@trezor/connect';
import { createMockDispatch, mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { discoveryActions } from './discoveryActions';
import {
    type RunDiscoveryThunkDeps,
    type RunDiscoveryThunkState,
    applyDeviceStatesThunk,
    runDiscoveryThunk,
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

describe('runDiscoveryThunk duplicates', () => {
    const existingWalletState: StaticSessionId = 'standard@device-id:1';
    const existingWallet = mockSuiteDevice({
        path: devicePath,
        instance: 1,
        connected: true,
        state: { staticSessionId: existingWalletState },
        useEmptyPassphrase: true,
    });

    const createState = (discovery: DiscoveryStatus): RunDiscoveryThunkState => ({
        wallet: {
            accounts: [],
            blockchain: blockchainInitialState,
            discovery: { [devicePath]: discovery },
            settings: initialWalletSettingsState,
        },
        device: {
            devices: [existingWallet, statelessDevice],
            selectedDevice: statelessDevice,
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

    const runDiscovery = async (discovery: DiscoveryStatus) => {
        // The device returns the state of the wallet which is already in the list.
        jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: 'standard@device-id:0' } },
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
