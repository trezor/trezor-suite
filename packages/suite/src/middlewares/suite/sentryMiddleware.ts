import { MiddlewareAPI } from 'redux';

import { METADATA } from '@suite/metadata';
import { MODAL_CLOSE, MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { analyticsActions } from '@suite-common/analytics-redux';
import { deviceActions } from '@suite-common/device';
import {
    WALLET_SETTINGS,
    accountsActions,
    blockchainActions,
    changeNetworks,
    setBaseCurrency,
} from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';
import { getBootloaderVersion, getFirmwareVersion } from '@trezor/device-utils';

import { DESKTOP_UPDATE, PROTOCOL, ROUTER, SUITE } from 'src/actions/suite/constants';
import { selectRouterUrl } from 'src/reducers/suite/routerReducer';
import { Action, AppState, Dispatch } from 'src/types/suite';
import { getSuiteReadyPayload } from 'src/utils/suite/analytics';
import {
    addSentryBreadcrumb,
    captureSentryMessage,
    setSentryContext,
    setSentryTag,
    withSentryScope,
} from 'src/utils/suite/sentry';

const deviceContextName = 'trezor-device';

const breadcrumbActions = new Set<Action['type']>([
    SUITE.SET_LANGUAGE,
    SUITE.SET_THEME,
    SUITE.SET_ADDRESS_DISPLAY_TYPE,
    SUITE.SET_AUTODETECT,
    setBaseCurrency.type,
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
    MODAL_CLOSE,
    DEVICE.CONNECT,
    DEVICE.DISCONNECT,
    accountsActions.createAccount.type,
    accountsActions.updateAccount.type,
    deviceActions.updateSelectedDevice.type,
    deviceActions.setRememberDevice.type,
    METADATA.ADD_PROVIDER,
    changeNetworks.type,
    TRANSPORT.START,
    TRANSPORT.ERROR,
    blockchainActions.setBackend.type,
    accountsActions.updateSelectedAccount.type,
    ROUTER.LOCATION_CHANGE,
    DESKTOP_UPDATE.ALLOW_PRERELEASE,
    SUITE.TOR_STATUS,
    SUITE.ONLINE_STATUS,
    deviceActions.addButtonRequest.type,
    deviceActions.removeButtonRequests.type,
    PROTOCOL.SAVE_COIN_PROTOCOL,
    MODAL_OPEN_USER_CONTEXT,
]);

const sentryMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        // pass action
        next(action);

        if (breadcrumbActions.has(action.type)) {
            addSentryBreadcrumb({
                category: 'redux.action',
                message: action.type,
                level: 'info',
            });
        }

        const state = api.getState();

        switch (action.type) {
            case SUITE.READY:
                // it is done async because some UAParser queries are async
                getSuiteReadyPayload(state).then(payload =>
                    setSentryContext('suite-ready', payload),
                );
                break;
            case deviceActions.selectDevice.type:
            case deviceActions.updateSelectedDevice.type: {
                setSentryContext(deviceContextName, {
                    bootloader:
                        action.payload?.mode === 'bootloader'
                            ? getBootloaderVersion(action.payload)
                            : undefined,
                    connected: action.payload?.connected ?? false, // default to false so that the property is visible in Sentry when device is disconnected
                    firmwareType: action.payload?.firmwareType, // note that T1B1/T2T1 in bootloader mode report undefined
                    firmwareVersion: action.payload
                        ? getFirmwareVersion(action.payload)
                        : undefined,
                    mode: action.payload?.mode,
                    model: action.payload?.features?.internal_model,
                    remember: action.payload?.remember,
                });
                break;
            }
            case ROUTER.LOCATION_CHANGE:
                setSentryTag('routerURL', selectRouterUrl(state));
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
            case deviceActions.setDeviceAuthenticityResult.type: {
                const { result } = action.payload;
                if (!result) return;

                const reportToSentry = (error: string) => {
                    withSentryScope(scope => {
                        scope.setLevel('error');
                        scope.setTag('deviceAuthenticityError', error);
                        captureSentryMessage(
                            `Device authenticity invalid! ${JSON.stringify(result, null, 2)}`,
                            scope,
                        );
                    });
                };

                // report error from the TrezorConnect call itself
                if ('error' in result) {
                    reportToSentry(result.error);
                }
                // report errors from either one of the secure elements (or both)
                if ('optigaResult' in result && result.optigaResult.error) {
                    reportToSentry(result.optigaResult.error);
                }
                if ('tropicResult' in result && result.tropicResult?.error) {
                    reportToSentry(result.tropicResult.error);
                }
                break;
            }
            default:
                break;
        }

        return action;
    };

export default sentryMiddleware;
