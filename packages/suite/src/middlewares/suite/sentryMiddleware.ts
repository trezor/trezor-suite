import { type Dispatch, type UnknownAction, isAnyOf } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { desktopUpdateActions } from '@suite/desktop-update';
import { METADATA } from '@suite/metadata';
import { MODAL_CLOSE, MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { routerLocationChange, selectRouterUrl } from '@suite/router';
import { suiteSettingsActions } from '@suite/settings';
import { onSuiteReady, updateOnlineStatus } from '@suite/suite-lifecycle';
import { torActions } from '@suite/tor';
import { analyticsActions } from '@suite-common/analytics-redux';
import { deviceActions } from '@suite-common/device';
import { discreetModeActions } from '@suite-common/discreet-mode';
import {
    WALLET_SETTINGS,
    accountsActions,
    blockchainActions,
    changeNetworks,
    setBaseCurrency,
} from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT, isTransportEventOfType } from '@trezor/connect';
import { getBootloaderVersion, getFirmwareVersion } from '@trezor/device-utils';

import { PROTOCOL } from 'src/actions/suite/constants';
import { type AppState } from 'src/types/suite';
import { getSuiteReadyPayload } from 'src/utils/suite/analytics';
import {
    addSentryBreadcrumb,
    captureSentryMessage,
    setSentryContext,
    setSentryTag,
    withSentryScope,
} from 'src/utils/suite/sentry';

const deviceContextName = 'trezor-device';

const breadcrumbActions = new Set<UnknownAction['type']>([
    suiteSettingsActions.setLanguage.type,
    suiteSettingsActions.setTheme.type,
    WALLET_SETTINGS.SET_ADDRESS_DISPLAY_TYPE,
    suiteSettingsActions.setAutodetect.type,
    setBaseCurrency.type,
    discreetModeActions.setDiscreetMode.type,
    METADATA.ENABLE,
    METADATA.DISABLE,
    suiteSettingsActions.setOnionLinks.type,
    analyticsActions.enableAnalytics.type,
    analyticsActions.disableAnalytics.type,
    desktopUpdateActions.checking.type,
    desktopUpdateActions.available.type,
    desktopUpdateActions.notAvailable.type,
    desktopUpdateActions.ready.type,
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
    routerLocationChange.type,
    desktopUpdateActions.allowPrerelease.type,
    torActions.setTorStatus.type,
    updateOnlineStatus.type,
    deviceActions.addButtonRequest.type,
    deviceActions.removeButtonRequests.type,
    PROTOCOL.SAVE_COIN_PROTOCOL,
    MODAL_OPEN_USER_CONTEXT,
]);

const sentryMiddleware =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
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

        if (onSuiteReady.match(action)) {
            // it is done async because some UAParser queries are async
            getSuiteReadyPayload(state).then(payload => setSentryContext('suite-ready', payload));
        } else if (
            isAnyOf(deviceActions.selectDevice, deviceActions.updateSelectedDevice)(action)
        ) {
            setSentryContext(deviceContextName, {
                bootloader:
                    action.payload?.mode === 'bootloader'
                        ? getBootloaderVersion(action.payload)
                        : undefined,
                connected: action.payload?.connected ?? false, // default to false so that the property is visible in Sentry when device is disconnected
                firmwareType: action.payload?.firmwareType, // note that T1B1/T2T1 in bootloader mode report undefined
                firmwareVersion: action.payload ? getFirmwareVersion(action.payload) : undefined,
                mode: action.payload?.mode,
                model: action.payload?.features?.internal_model,
                remember: action.payload?.remember,
            });
        } else if (routerLocationChange.match(action)) {
            setSentryTag('routerURL', selectRouterUrl(state));
        } else if (torActions.setTorStatus.match(action)) {
            setSentryTag('torStatus', action.payload);
        } else if (isTransportEventOfType(action, TRANSPORT.START)) {
            const { type, version } = action.payload;
            setSentryContext('transport', {
                name: type /* type key is used internally by Sentry so it's not allowed */,
                version: version || 'not-available',
            });
        } else if (deviceActions.setDeviceAuthenticityResult.match(action)) {
            const { result } = action.payload;
            if (!result) return action;

            const reportToSentry = (error: string, errorDetails?: string) => {
                withSentryScope(scope => {
                    scope.setLevel('error');
                    scope.setTag('deviceAuthenticityError', error);
                    scope.setExtra('errorDetails', errorDetails);
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
                const { error, errorDetails } = result.optigaResult;
                reportToSentry(error, errorDetails);
            }
            if ('tropicResult' in result && result.tropicResult?.error) {
                const { error, errorDetails } = result.tropicResult;
                reportToSentry(error, errorDetails);
            }
            if ('mcuResult' in result && result.mcuResult?.error) {
                const { error, errorDetails } = result.mcuResult;
                reportToSentry(error, errorDetails);
            }
        }

        return action;
    };

export default sentryMiddleware;
