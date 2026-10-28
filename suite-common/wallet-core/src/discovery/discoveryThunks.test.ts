import { combineReducers } from '@reduxjs/toolkit';

import { type DeviceRootState, prepareDeviceReducer } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asDeviceUniquePath } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { applyDeviceStatesThunk } from './discoveryThunks';
import {
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '../settings/walletSettingsReducer';

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
