/* eslint-disable @typescript-eslint/camelcase */

import { DEVICE } from 'trezor-connect';
import * as STEP from '@onboarding-constants/steps';
import onboardingReducer from '@onboarding-reducers';
import { Action } from '@suite-types';

const { getConnectDevice, getDeviceFeatures } = global.JestMocks;

type State = ReturnType<typeof onboardingReducer>;
const getInitialState = (state?: Partial<State>): State => ({
    ...onboardingReducer(undefined, {} as Action),
    reducerEnabled: true,
    ...state,
});

describe('onboarding reducer', () => {
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
            const state = onboardingReducer(
                getInitialState({ activeStepId: STEP.ID_BACKUP_STEP }),
                {
                    type: DEVICE.DISCONNECT,
                    payload: device,
                },
            );
            expect(state.prevDevice).toEqual(device);
        });

        it('if new prevDevice to be does not match current prevDevice, do not change prevDevice', () => {
            const device1 = getConnectDevice({ features: getDeviceFeatures({ device_id: '1' }) });
            const device2 = getConnectDevice({ features: getDeviceFeatures({ device_id: '2' }) });

            const state = onboardingReducer(
                getInitialState({ prevDevice: device1, activeStepId: STEP.ID_BACKUP_STEP }),
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
