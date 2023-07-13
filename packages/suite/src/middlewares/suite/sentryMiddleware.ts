import { MiddlewareAPI } from 'redux';
import { WALLET_SETTINGS } from 'src/actions/settings/constants';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import {
    SUITE,
    ROUTER,
    DESKTOP_UPDATE,
    METADATA,
    MODAL,
    PROTOCOL,
} from 'src/actions/suite/constants';
import { getSuiteReadyPayload } from 'src/utils/suite/analytics';
import { addSentryBreadcrumb, setSentryContext, setSentryTag } from 'src/utils/suite/sentry';
import { AppState, Action, Dispatch } from 'src/types/suite';

import { getBootloaderVersion, getDeviceModel, getFirmwareVersion } from '@trezor/device-utils';
import { DEVICE, TRANSPORT } from '@trezor/connect';
import { accountsActions, blockchainActions } from '@suite-common/wallet-core';
import { analyticsActions } from '@suite-common/analytics';
import { discoveryActions } from 'src/actions/wallet/discoveryActions';

const deviceContextName = 'trezor-device';

const breadcrumbActions = [
    SUITE.SET_LANGUAGE,
    SUITE.SET_THEME,
    SUITE.SET_AUTODETECT,
    walletSettingsActions.setLocalCurrency.type,
    WALLET_SETTINGS.SET_HIDE_BALANCE,
    METADATA.ENABLE,
    METADATA.DISABLE,
    SUITE.ONION_LINKS,
    analyticsActions.enableAnalytics.type,
    analyticsActions.disableAnalytics.type,
    DESKTOP_UPDATE.CHECKING,
    DESKTOP_UPDATE.AVAILABLE,
    DESKTOP_UPDATE.NOT_AVAILABLE,
    DESKTOP_UPDATE.READY,
    MODAL.CLOSE,
    SUITE.AUTH_DEVICE,
    DEVICE.CONNECT,
    DEVICE.DISCONNECT,
    accountsActions.createAccount.type,
    accountsActions.updateAccount.type,
    discoveryActions.completeDiscovery.type,
    SUITE.UPDATE_SELECTED_DEVICE,
    SUITE.REMEMBER_DEVICE,
    METADATA.SET_PROVIDER,
    walletSettingsActions.changeNetworks.type,
    TRANSPORT.START,
    TRANSPORT.ERROR,
    blockchainActions.setBackend.type,
    accountsActions.updateSelectedAccount.type,
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
                level: 'info',
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
                    firmware: getFirmwareVersion(action.payload),
                    isBitcoinOnly: action.payload.firmwareType === 'bitcoin-only',
                    bootloader: getBootloaderVersion(action.payload),
                    model: getDeviceModel(state.suite.device),
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
