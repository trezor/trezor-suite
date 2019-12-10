/* eslint-disable @typescript-eslint/camelcase */

import { UI, DEVICE } from 'trezor-connect';
import * as STEP from '@onboarding-constants/steps';
import onboardingReducer from '@onboarding-reducers';
import { Action } from '@suite-types';

const { getConnectDevice, getDeviceFeatures } = global.JestMocks;

const getUiRequestButtonPayload = () => ({
    code: 'bar',
    device: getConnectDevice(),
});

const getUiRequestPinPayload = () => ({
    device: getConnectDevice(),
});

type State = ReturnType<typeof onboardingReducer>;
const getInitialState = (state?: Partial<State>): State => ({
    ...onboardingReducer(undefined, {} as Action),
    reducerEnabled: true,
    ...state,
});

describe('onboarding reducer', () => {
    describe('UI.REQUEST_BUTTON, UI.REQUEST_WORD, UI.REQUEST_PIN', () => {
        it('same events should KEEP name and INCREMENT counter', () => {
            const stateAfterFirstEvent = onboardingReducer(getInitialState(), {
                type: UI.REQUEST_BUTTON,
                payload: getUiRequestButtonPayload(),
            });

            expect(stateAfterFirstEvent).toMatchObject({
                uiInteraction: {
                    counter: 0,
                    name: 'bar',
                },
            });

            const stateAfterSecondEvent = onboardingReducer(stateAfterFirstEvent, {
                type: UI.REQUEST_BUTTON,
                payload: getUiRequestButtonPayload(),
            });

            expect(stateAfterSecondEvent).toMatchObject({
                uiInteraction: {
                    counter: 1,
                    name: 'bar',
                },
            });
        });

        it('different events should CHANGE name and RESET counter', () => {
            const stateAfterFirstEvent = onboardingReducer(getInitialState(), {
                type: UI.REQUEST_BUTTON,
                payload: getUiRequestButtonPayload(),
            });

            expect(stateAfterFirstEvent).toMatchObject({
                uiInteraction: {
                    counter: 0,
                    name: 'bar',
                },
            });

            const stateAfterSecondEvent = onboardingReducer(stateAfterFirstEvent, {
                type: UI.REQUEST_PIN,
                payload: getUiRequestPinPayload(),
            });

            expect(stateAfterSecondEvent).toMatchObject({
                uiInteraction: {
                    counter: 0,
                    name: UI.REQUEST_PIN,
                },
            });
        });
    });

    describe('DEVICE.DISCONNECT', () => {
        it('should not change state if current step does not care about prevDevice (initial state step does not care)', () => {
            const state = onboardingReducer(
                getInitialState({ activeStepId: STEP.ID_WELCOME_STEP }),
                {
                    type: DEVICE.DISCONNECT,
                    payload: getConnectDevice(),
                },
            );
            expect(state.prevDevice).toEqual(null);
        });

        it('should change prevDevice field on step that does care', () => {
            const device = getConnectDevice();
            const state = onboardingReducer(getInitialState({ activeStepId: STEP.ID_NAME_STEP }), {
                type: DEVICE.DISCONNECT,
                payload: device,
            });
            expect(state.prevDevice).toEqual(device);
        });

        it('if new prevDevice to be does not match current prevDevice, do not change prevDevice', () => {
            const device1 = getConnectDevice({ features: getDeviceFeatures({ device_id: '1' }) });
            const device2 = getConnectDevice({ features: getDeviceFeatures({ device_id: '2' }) });

            const state = onboardingReducer(
                getInitialState({ prevDevice: device1, activeStepId: STEP.ID_NAME_STEP }),
                {} as Action,
            );

            const result = onboardingReducer(state, {
                type: DEVICE.DISCONNECT,
                payload: device2,
            });
            expect(result.prevDevice).toEqual(device1);
        });
    });
});
