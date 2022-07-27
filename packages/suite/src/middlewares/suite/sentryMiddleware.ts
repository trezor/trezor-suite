/* eslint-disable @typescript-eslint/naming-convention */

import { MiddlewareAPI } from 'redux';
import { DEVICE, TRANSPORT } from '@trezor/connect';
import { WALLET_SETTINGS } from '@settings-actions/constants';

import {
    SUITE,
    ROUTER,
    ANALYTICS,
    DESKTOP_UPDATE,
    METADATA,
    MODAL,
    PROTOCOL,
} from '@suite-actions/constants';
import { getFwVersion, getBootloaderVersion, isDeviceBitcoinOnly } from '@suite-utils/device';
import { getSuiteReadyPayload } from '@suite-utils/analytics';
import { addSentryBreadcrumb, setSentryContext, setSentryTag } from '@suite-utils/sentry';

import { AppState, Action, Dispatch } from '@suite-types';
import { ACCOUNT, BLOCKCHAIN, DISCOVERY } from '@wallet-actions/constants';

import { Severity } from '@sentry/types';

const deviceContextName = 'trezor-device';

const breadcrumbActions = [
    SUITE.SET_LANGUAGE,
    SUITE.SET_THEME,
    SUITE.SET_AUTODETECT,
    WALLET_SETTINGS.SET_LOCAL_CURRENCY,
    WALLET_SETTINGS.SET_HIDE_BALANCE,
    METADATA.ENABLE,
    METADATA.DISABLE,
    SUITE.ONION_LINKS,
    ANALYTICS.ENABLE,
    ANALYTICS.DISABLE,
    DESKTOP_UPDATE.CHECKING,
    DESKTOP_UPDATE.AVAILABLE,
    DESKTOP_UPDATE.NOT_AVAILABLE,
    DESKTOP_UPDATE.READY,
    MODAL.CLOSE,
    SUITE.AUTH_DEVICE,
    DEVICE.CONNECT,
    DEVICE.DISCONNECT,
    ACCOUNT.CREATE,
    ACCOUNT.UPDATE,
    DISCOVERY.COMPLETE,
    SUITE.UPDATE_SELECTED_DEVICE,
    SUITE.REMEMBER_DEVICE,
    METADATA.SET_PROVIDER,
    WALLET_SETTINGS.CHANGE_NETWORKS,
    TRANSPORT.START,
    TRANSPORT.ERROR,
    BLOCKCHAIN.SET_BACKEND,
    ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    ROUTER.LOCATION_CHANGE,
    DESKTOP_UPDATE.ALLOW_PRERELEASE,
    SUITE.TOR_STATUS,
    SUITE.ONLINE_STATUS,
    SUITE.ADD_BUTTON_REQUEST,
    PROTOCOL.SAVE_COIN_PROTOCOL,
    MODAL.OPEN_USER_CONTEXT,
];

const sentryMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        // pass action
        next(action);

        if (breadcrumbActions.includes(action.type)) {
            addSentryBreadcrumb({
                category: 'redux.action',
                message: action.type,
                level: Severity.Info,
            });
        }

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
                    isBitcoinOnly: isDeviceBitcoinOnly(action.payload),
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
            case TRANSPORT.START: {
                const { type, version } = action.payload;
                setSentryContext('transport', {
                    name: type /* type key is used internally by Sentry so it's not allowed */,
                    version: version || 'not-available',
                });
                break;
            }
            default:
                break;
        }
        return action;
    };

export default sentryMiddleware;
