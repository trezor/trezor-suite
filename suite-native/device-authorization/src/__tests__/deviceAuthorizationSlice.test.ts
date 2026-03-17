import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { UI_REQUEST } from '@trezor/connect/src/exports';

import {
    type DeviceAuthorizationState,
    DeviceAuthorizationStep,
    deviceAuthorizationInitialState,
    deviceAuthorizationReducer,
} from '../deviceAuthorizationSlice';
import { flowEndingButtonRequests, pinButtonRequestCodes } from '../utils';

describe('deviceAuthorizationSlice', () => {
    const getDeviceAuthorizationState = (
        partialState: Partial<DeviceAuthorizationState>,
    ): DeviceAuthorizationState => ({ ...deviceAuthorizationInitialState, ...partialState });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            expect(deviceAuthorizationReducer(undefined, { type: 'unknown' })).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
            });
        });
    });

    describe('UI_REQUEST.REQUEST_PIN', () => {
        it('should set deviceAuthorizationStep to PinRequested', () => {
            const state = deviceAuthorizationReducer(undefined, { type: UI_REQUEST.REQUEST_PIN });

            expect(state).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.PinRequested,
            });
        });
    });

    describe('UI_REQUEST.REQUEST_PASSPHRASE', () => {
        it('should set deviceAuthorizationStep to PassphraseRequested when device has staticSessionId', () => {
            const state = deviceAuthorizationReducer(undefined, {
                type: UI_REQUEST.REQUEST_PASSPHRASE,
                payload: {
                    // @ts-expect-error This is how connect sends the payload for device state, but then it's stored differently in redux so this utils doesn't recognize
                    // this type of property. For testing purposes however, it's fine.
                    device: mockSuiteDevice({ state: { staticSessionId: 'test-session-id' } }),
                },
            });

            expect(state).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.PassphraseRequested,
            });
        });

        // Note: This case can happen if you try to create a new passphrase wallet but your device is locked.
        // We will unlock the device for feature (discovery of hidden wallet), but that's the end of device authorization.
        // Passphrase request is than handled by passphrase flow.
        it('should set deviceAuthorizationStep to Idle when device does not have staticSessionId', () => {
            const prevState = getDeviceAuthorizationState({
                deviceAuthorizationStep: DeviceAuthorizationStep.PinRequested,
            });

            const state = deviceAuthorizationReducer(prevState, {
                type: UI_REQUEST.REQUEST_PASSPHRASE,
            });

            expect(state).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
            });
        });

        it('should set deviceAuthorizationStep to Idle when device staticSessionId from connect is undefined', () => {
            const state = deviceAuthorizationReducer(undefined, {
                type: UI_REQUEST.REQUEST_PASSPHRASE,
                payload: {
                    device: { ...mockSuiteDevice(), state: { staticSessionId: undefined } },
                },
            });

            expect(state).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
            });
        });
    });

    describe('UI_REQUEST.CLOSE_UI_WINDOW', () => {
        it('should reset deviceAuthorizationStep to Idle from any state', () => {
            const prevState = getDeviceAuthorizationState({
                deviceAuthorizationStep: DeviceAuthorizationStep.PassphraseRequested,
            });

            const state = deviceAuthorizationReducer(prevState, {
                type: UI_REQUEST.CLOSE_UI_WINDOW,
            });

            expect(state).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
            });
        });
    });

    describe('isPinButtonRequestCode matcher', () => {
        it.each(pinButtonRequestCodes)(
            'should set deviceAuthorizationStep to PinRequested for %s code',
            code => {
                const state = deviceAuthorizationReducer(undefined, {
                    type: UI_REQUEST.REQUEST_BUTTON,
                    payload: { code },
                });

                expect(state).toEqual({
                    deviceAuthorizationStep: DeviceAuthorizationStep.PinRequested,
                });
            },
        );
    });

    describe('isFlowEndingButtonRequest matcher', () => {
        it.each(flowEndingButtonRequests)(
            'should reset deviceAuthorizationStep to Idle for %s',
            code => {
                const prevState = getDeviceAuthorizationState({
                    deviceAuthorizationStep: DeviceAuthorizationStep.PassphraseRequested,
                });

                const state = deviceAuthorizationReducer(prevState, {
                    type: UI_REQUEST.REQUEST_BUTTON,
                    payload: { code },
                });

                expect(state).toEqual({
                    deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
                });
            },
        );
    });

    describe('isSuiteSyncButtonRequest matcher', () => {
        it('should set deviceAuthorizationStep to ContinueOnTrezorRequested for secure_sync button request', () => {
            const state = deviceAuthorizationReducer(undefined, {
                type: UI_REQUEST.REQUEST_BUTTON,
                payload: { name: 'secure_sync' },
            });

            expect(state).toEqual({
                deviceAuthorizationStep: DeviceAuthorizationStep.ContinueOnTrezorRequested,
            });
        });
    });
});
