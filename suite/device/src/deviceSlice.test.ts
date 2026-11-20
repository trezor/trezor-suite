import { deviceActions } from '@suite-common/device';
import { mockConnectDevice } from '@suite-common/suite-types/mocks';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import {
    type DesktopDeviceState,
    initialState,
    prepareDesktopDeviceReducer,
    setConnectionModal,
    setConnectionMode,
    toggleConnectionModal,
} from './deviceSlice';

const deviceReducer = prepareDesktopDeviceReducer({
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

const openInBluetoothMode = (): DesktopDeviceState => {
    const state = deviceReducer(initialState, setConnectionMode('bluetooth'));

    return deviceReducer(state, setConnectionModal(true));
};

describe('deviceSlice connection modal', () => {
    it('keeps the bluetooth mode when the modal opens', () => {
        const state = openInBluetoothMode();

        expect(state.isConnectionModalOpen).toBe(true);
        expect(state.defaultConnectionMode).toBe('bluetooth');
    });

    it('keeps the bluetooth mode when the modal is toggled open', () => {
        const state = deviceReducer(
            deviceReducer(initialState, toggleConnectionModal()),
            setConnectionMode('bluetooth'),
        );

        expect(state.isConnectionModalOpen).toBe(true);
        expect(state.defaultConnectionMode).toBe('bluetooth');
    });

    it.each([
        ['setConnectionModal(false)', setConnectionModal(false)],
        ['toggleConnectionModal()', toggleConnectionModal()],
        [
            'connectDevice',
            deviceActions.connectDevice({ device: mockConnectDevice({ path: '1' }) }),
        ],
        [
            'connectUnacquiredDevice',
            deviceActions.connectUnacquiredDevice({
                device: mockConnectDevice({ path: '1', type: 'unacquired' }),
            }),
        ],
    ])('resets the connection mode to cable when closed by %s', (_, action) => {
        const state = deviceReducer(openInBluetoothMode(), action);

        expect(state.isConnectionModalOpen).toBe(false);
        expect(state.defaultConnectionMode).toBe('cable');
    });
});
