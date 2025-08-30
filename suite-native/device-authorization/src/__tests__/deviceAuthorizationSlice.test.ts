import { UI } from '@trezor/connect';

import {
    DeviceAuthorizationState,
    deviceAuthorizationInitialState,
    deviceAuthorizationReducer,
} from '../deviceAuthorizationSlice';

describe('deviceAuthorizationSlice', () => {
    const getDeviceAuthorizationState = (
        partialState: Partial<DeviceAuthorizationState>,
    ): DeviceAuthorizationState => ({ ...deviceAuthorizationInitialState, ...partialState });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            expect(deviceAuthorizationReducer(undefined, { type: 'unknown' })).toEqual({
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });
    });

    describe('UI.CLOSE_UI_WINDOW', () => {
        it('should set correct state', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPassphrase: true,
                checkPassphraseOnDevice: true,
                inputPassphraseOnDevice: true,
            });
            const action = { type: UI.CLOSE_UI_WINDOW };

            expect(deviceAuthorizationReducer(prevState, action)).toEqual({
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });
    });
});
