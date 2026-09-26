import { type AnalyticsDep, events as sharedEvents } from '@suite-common/analytics';
import {
    type DeviceRootState,
    selectDevices,
    selectIsPendingTransportEvent,
} from '@suite-common/device';
import { type FirmwareRootState, selectEffectiveFirmwareChannel } from '@suite-common/firmware';
import {
    Feature,
    type MessageSystemRootState,
    parseTimeoutThresholdsPerModel,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { type DispatchDep } from '@suite-common/redux-utils';
import {
    type ConnectInit,
    type ConnectInitDeviceEventHooksDep,
    type GetAllowPrereleaseDep,
    type GetBinFilesBaseUrlDep,
} from '@suite-common/suite-types';
import { type GetThpSettingsDep, type ThpHostNameDep } from '@suite-common/thp';
import {
    type WalletSettingsRootState,
    defaultTrezorUIEventHandlerThunk,
    deviceConnectThunk,
    isScopedCallId,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    type CreateLoggerDep,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import {
    type ConnectInitSettingsDep,
    type GetDebugSettingsDep,
    type TransportsDep,
} from './connectInitTypes';
import { type WrapTrezorConnect } from './createWrapTrezorConnect';

// connectInitSettings is defined in the platform composition root:
// packages/suite/src/support/createSuiteCompositionRoot.ts or
// suite-native/state/src/createNativeServicesCompositionRoot.ts.

export type ConnectInitState = DeviceRootState &
    FirmwareRootState &
    MessageSystemRootState &
    WalletSettingsRootState;

export type ConnectInitDeps = DispatchDep & {
    getState: () => ConnectInitState;
    analytics: Pick<AnalyticsDep['analytics'], 'report'>;
    wrapTrezorConnect: WrapTrezorConnect;
} & ConnectInitDeviceEventHooksDep &
    ConnectInitSettingsDep &
    CreateLoggerDep &
    GetAllowPrereleaseDep &
    GetBinFilesBaseUrlDep &
    GetDebugSettingsDep &
    GetThpSettingsDep &
    ThpHostNameDep &
    TransportsDep;

export const createConnectInit =
    (deps: ConnectInitDeps): ConnectInit =>
    async () => {
        // set event listeners and dispatch as
        TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
            if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
                // This special case here allows us to "inject" extra data into action's payload
                // and change the type of the action (in this case DeviceEvent type !== Redux Action type)
                const connectedDevices = selectDevices(deps.getState());
                deps.dispatch(
                    deviceConnectThunk({ type: eventData.type, device: eventData.payload }),
                );

                deps.connectInitDeviceEventHooks[eventData.type]?.(
                    eventData.payload,
                    connectedDevices,
                );
            } else {
                // dispatch event as action
                deps.dispatch({ type: eventData.type, payload: eventData.payload });

                if (eventData.type === DEVICE.THP_PAIRING_STATUS_CHANGED) {
                    const { status } = eventData.payload;
                    if (status === 'finished' || status === 'canceled') {
                        deps.analytics.report({
                            type: sharedEvents.deviceConnectionDeviceConfirmationEvent.name,
                            payload: { option: status },
                        });
                    }
                }
            }
        });

        TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
            // A bare `callId` is not proof of ownership — it doubles as the
            // cancellation token — so defer only events a scoped flow has registered.
            if ('callId' in action && action.callId && isScopedCallId(action.callId)) {
                return;
            }
            deps.dispatch(defaultTrezorUIEventHandlerThunk(action));
        });

        TrezorConnect.on(UI_REQUEST, ({ event: _, ...action }) => {
            // A bare `callId` is not proof of ownership — it doubles as the
            // cancellation token — so defer only events a scoped flow has registered.
            if ('callId' in action && action.callId && isScopedCallId(action.callId)) {
                return;
            }
            deps.dispatch(defaultTrezorUIEventHandlerThunk(action));
        });

        TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            deps.dispatch(action);
        });

        TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            deps.dispatch(action);
        });

        deps.wrapTrezorConnect();

        const binFilesBaseUrl = deps.getBinFilesBaseUrl();

        const firmwareHashCheckTimeoutsOverride = parseTimeoutThresholdsPerModel(
            selectFeatureConfig(deps.getState(), Feature.firmwareHashCheckTimeout),
        );
        const firmwareHashCheckTimeouts = {
            ...deps.connectInitSettings.firmwareHashCheckTimeouts,
            ...firmwareHashCheckTimeoutsOverride,
        };

        const {
            transports: debugTransports,
            showConnectLogs,
            definitionsChannel,
        } = deps.getDebugSettings();
        const thp = deps.getThpSettings();
        // desktop thp appName/hostName enhanced in ./suite/desktop-app-main/src/modules/trezor-connect.ts
        if (deps.thpHostName !== undefined) {
            thp.hostName = deps.thpHostName;
        }

        try {
            await TrezorConnect.init({
                ...deps.connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(deps.getState()),
                transports: deps.createTransports(debugTransports),
                thp,
                debug: showConnectLogs,
                createLogger: deps.createLogger,
                firmwareHashCheckTimeouts,
                firmwareChannel: selectEffectiveFirmwareChannel(
                    deps.getState(),
                    deps.getAllowPrerelease(),
                ),
                definitionsChannel,
                // Suite's enabled coins, declared to Connect one-way (Suite is the source of truth).
                enabledNetworks: selectEnabledNetworks(deps.getState()).map(coin => ({
                    coin: asCoinSymbol(coin),
                })),
            });
        } catch (error) {
            let formattedError: string;
            if (typeof error === 'string') {
                formattedError = error;
            } else {
                formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
            }
            throw new Error(formattedError, { cause: error });
        }
    };
