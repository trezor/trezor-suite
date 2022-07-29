/* eslint-disable @typescript-eslint/naming-convention */

import { MiddlewareAPI } from 'redux';
import { DEVICE } from '@trezor/connect';

import { SUITE, ROUTER } from '@suite-actions/constants';
import { getFwVersion, getBootloaderVersion, isBitcoinOnly } from '@suite-utils/device';
import { getSuiteReadyPayload } from '@suite-utils/analytics';
import { setSentryContext, setSentryTag } from '@suite-utils/sentry';

import type { AppState, Action, Dispatch } from '@suite-types';

const deviceContextName = 'trezor-device';

const sentryMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        // pass action
        next(action);

        const state = api.getState();

        switch (action.type) {
            case SUITE.READY:
                setSentryContext('suite-ready', getSuiteReadyPayload(state));
                break;
            case DEVICE.CONNECT: {
                const { features, mode } = action.payload;

                if (!features || !mode) return;

                setSentryContext(deviceContextName, {
                    mode,
                    firmware: getFwVersion(action.payload),
                    isBitcoinOnly: isBitcoinOnly(action.payload),
                    bootloader: getBootloaderVersion(action.payload),
                    model: features.model,
                });
                break;
            }
            case DEVICE.DISCONNECT:
                setSentryContext(deviceContextName, {
                    disconnected: true,
                });
                break;
            case ROUTER.LOCATION_CHANGE:
                setSentryTag('routerURL', action.payload.url);
                break;
            case SUITE.TOR_STATUS:
                setSentryTag('torStatus', action.payload);
                break;

            default:
                break;
        }
        return action;
    };

export default sentryMiddleware;
