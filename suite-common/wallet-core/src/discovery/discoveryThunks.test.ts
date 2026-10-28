import { combineReducers } from '@reduxjs/toolkit';

import { type DeviceRootState, prepareDeviceReducer } from '@suite-common/device';
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

const initStore = () =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            device: deviceReducer,
            wallet: combineReducers({
                settings: (state = initialWalletSettingsState) => state,
            }),
        }),
        preloadedState: {
            device: {
                devices: [hiddenWallet, statelessDevice],
                buttonRequestsByPath: {},
            },
        },
    }).services.store;

describe('applyDeviceStatesThunk', () => {
    it('authorizes the stateless device when an authorized wallet is listed first on the same path', async () => {
        const store = initStore();

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
});
