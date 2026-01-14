import { UI } from '@trezor/connect';

import {
    DeviceAuthorizationState,
    DeviceAuthorizationStep,
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
                deviceState: DeviceAuthorizationStep.Idle,
            });
        });
    });

    describe('UI.REQUEST_PIN', () => {
        it('should set `hasDeviceRequestedPin`', () => {
            expect(deviceAuthorizationReducer(undefined, { type: UI.REQUEST_PIN })).toEqual({
                deviceState: DeviceAuthorizationStep.PinRequested,
            });
        });
    });
    describe('UI.REQUEST_PASSPHRASE', () => {
        it('should set hasDeviceRequestedPassphrase', () => {
            const prevState = getDeviceAuthorizationState({
                deviceAuthorizationStep: DeviceAuthorizationStep.PinRequested,
            });

            const state = deviceAuthorizationReducer(prevState, { type: UI.REQUEST_PASSPHRASE });

            expect(state).toEqual({
                deviceState: DeviceAuthorizationStep.PassphraseRequested,
            });
        });
    });

    describe('UI.REQUEST_BUTTON', () => {
        it('should react to code `ButtonRequest_PinEntry`', () => {
            const prevState = getDeviceAuthorizationState({
                deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
            });
            const action = { type: UI.REQUEST_BUTTON, payload: { code: 'ButtonRequest_PinEntry' } };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                deviceState: DeviceAuthorizationStep.PinRequested,
            });
        });

        it('should react to code  `PinMatrixRequestType_Current`', () => {
            const prevState = getDeviceAuthorizationState({
                deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
            });
            const action = {
                type: UI.REQUEST_BUTTON,
                payload: { code: 'PinMatrixRequestType_Current' },
            };

            const state = deviceAuthorizationReducer(prevState, action);

            expect(state).toEqual({
                deviceState: DeviceAuthorizationStep.PinRequested,
            });
        });
    });

    describe('UI.CLOSE_UI_WINDOW', () => {
        it('should set correct state', () => {
            const prevState = getDeviceAuthorizationState({
                deviceAuthorizationStep: DeviceAuthorizationStep.PassphraseRequested,
            });
            const action = { type: UI.CLOSE_UI_WINDOW };

            expect(deviceAuthorizationReducer(prevState, action)).toEqual({
                deviceState: DeviceAuthorizationStep.Idle,
            });
        });
    });
});
