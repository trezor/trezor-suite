/* eslint-disable @typescript-eslint/camelcase */

import { MiddlewareAPI } from 'redux';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';

import { AppState, Action, Dispatch } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';

/*
    In analytics middleware we may intercept actions we would like to log. For example:
    - trezor model
    - firmware version
    - transport (webusb/bridge) and its version
    - backup type (shamir/bip39)
*/

const analytics = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);
    const state = api.getState();

    switch (action.type) {
        case TRANSPORT.START:
            api.dispatch(
                analyticsActions.report({
                    type: 'transport-type',
                    payload: {
                        type: action.payload.type,
                        version: action.payload.version,
                    },
                }),
            );
            break;
        case DEVICE.CONNECT:
            // logging only if not in bootloader
            if (action.payload.id) {
                const { features } = action.payload;
                api.dispatch(
                    analyticsActions.report({
                        type: 'device-connect',
                        payload: {
                            device_id: action.payload.id,
                            firmware: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
                            // @ts-ignore todo add to features types, missing
                            backup_type: features.backup_type || 'Bip39',
                        },
                    }),
                );
            }
            break;
        case SUITE.SET_FLAG:
            // here we are reporting some information of user after he finishes initalRun
            if (action.key === 'initialRun' && action.value === false) {
                api.dispatch(
                    analyticsActions.report({
                        type: 'initial-run-completed',
                        payload: {
                            analytics: state.suite.settings.analytics,
                            createSeed: state.onboarding.path.includes('create'),
                            recoverSeed: state.onboarding.path.includes('recovery'),
                            newDevice: state.onboarding.path.includes('new'),
                            usedDevice: state.onboarding.path.includes('used'),
                            // backupError: state.backup.error,
                            recoveryError: state.recovery.error,
                            firmwareError: state.firmware.error,
                        },
                    }),
                );
            }
            break;
        default:
            break;
    }
    return action;
};

export default analytics;
