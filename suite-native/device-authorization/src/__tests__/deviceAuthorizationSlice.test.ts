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
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });
    });

    describe('UI.REQUEST_PIN', () => {
        it('should set `hasDeviceRequestedPin`', () => {
            expect(deviceAuthorizationReducer(undefined, { type: UI.REQUEST_PIN })).toEqual({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });
    });
    describe('UI.REQUEST_PASSPHRASE', () => {
        it('should set hasDeviceRequestedPassphrase', () => {
            const prevState = getDeviceAuthorizationState({ hasDeviceRequestedPin: true });

            const state = deviceAuthorizationReducer(prevState, { type: UI.REQUEST_PASSPHRASE });

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: true,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });
    });

    describe('UI.REQUEST_BUTTON', () => {
        it('should react to code `ButtonRequest_PinEntry`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = { type: UI.REQUEST_BUTTON, payload: { code: 'ButtonRequest_PinEntry' } };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });

        it('should react to code  `PinMatrixRequestType_Current`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = {
                type: UI.REQUEST_BUTTON,
                payload: { code: 'PinMatrixRequestType_Current' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });

        it('should react to code `ButtonRequest_Other`', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
            });
            const action = {
                type: UI.REQUEST_BUTTON,
                payload: { code: 'ButtonRequest_Other' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: true,
                checkPassphraseOnDevice: true,
                inputPassphraseOnDevice: false,
            });
        });
    });

    describe('UI.CLOSE_UI_WINDOW', () => {
        it('should set correct state', () => {
            const prevState = getDeviceAuthorizationState({
                hasDeviceRequestedPin: true,
                hasDeviceRequestedPassphrase: true,
                checkPassphraseOnDevice: true,
                inputPassphraseOnDevice: true,
            });
            const action = { type: UI.CLOSE_UI_WINDOW };

            expect(deviceAuthorizationReducer(prevState, action)).toEqual({
                hasDeviceRequestedPin: false,
                hasDeviceRequestedPassphrase: false,
                checkPassphraseOnDevice: false,
                inputPassphraseOnDevice: false,
            });
        });
    });
});
