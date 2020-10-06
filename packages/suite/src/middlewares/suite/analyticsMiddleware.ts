/* eslint-disable @typescript-eslint/camelcase */

import { MiddlewareAPI } from 'redux';
import { TRANSPORT, DEVICE } from 'trezor-connect';
import { SUITE, STORAGE } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';

import { AppState, Action, Dispatch } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';
import {
    getScreenWidth,
    getScreenHeight,
    getPlatform,
    getPlatformLanguage,
} from '@suite-utils/env';

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
        case STORAGE.LOADED:
            api.dispatch(
                analyticsActions.report({
                    type: 'suite-ready',
                    payload: {
                        language: state.suite.settings.language,
                        enabledNetworks: state.wallet.settings.enabledNetworks,
                        localCurrency: state.wallet.settings.localCurrency,
                        discreetMode: state.wallet.settings.discreetMode,
                        screenWidth: getScreenWidth(),
                        screenHeight: getScreenHeight(),
                        platform: getPlatform(),
                        platformLanguage: getPlatformLanguage(),
                    },
                }),
            );
            break;
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
        case DEVICE.CONNECT: {
            const { features, mode } = action.payload;
            if (features && mode !== 'bootloader') {
                api.dispatch(
                    analyticsActions.report({
                        type: 'device-connect',
                        payload: {
                            mode,
                            firmware: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
                            // backup_type: features.backup_type || 'Bip39', // @ts-ignore todo add to features types, missing
                            pin_protection: features.pin_protection,
                            passphrase_protection: features.passphrase_protection,
                            totalInstances: api.getState().devices.length,
                            // todo: totalDevices
                            // it should be easy like this:
                            // totalDevices: api.getState().devices.filter(d => !d.instance).length,
                            // but it acts weird on my setup, investigate.
                        },
                    }),
                );
            } else {
                api.dispatch(
                    analyticsActions.report({
                        type: 'device-connect',
                        payload: {
                            mode: 'bootloader',
                        },
                    }),
                );
            }
            break;
        }
        case SUITE.SET_FLAG:
            // here we are reporting some information of user after he finishes initialRun
            if (action.key === 'initialRun' && action.value === false) {
                if (state.analytics.enabled) {
                    api.dispatch(
                        analyticsActions.report(
                            {
                                type: 'initial-run-completed',
                                payload: {
                                    analytics: true,
                                    createSeed: state.onboarding.path.includes('create'),
                                    recoverSeed: state.onboarding.path.includes('recovery'),
                                    newDevice: state.onboarding.path.includes('new'),
                                    usedDevice: state.onboarding.path.includes('used'),
                                },
                            },
                            false,
                        ),
                    );
                } else {
                    api.dispatch(
                        analyticsActions.report(
                            {
                                type: 'initial-run-completed',
                                payload: {
                                    analytics: false,
                                },
                            },
                            true,
                        ),
                    );
                }
            }
            break;
        case ACCOUNT.CREATE:
            api.dispatch(
                analyticsActions.report({
                    type: 'account-create',
                    payload: {
                        type: action.payload.accountType,
                        symbol: action.payload.symbol,
                        path: action.payload.path,
                    },
                }),
            );
            break;
        default:
            break;
    }
    return action;
};

export default analytics;
