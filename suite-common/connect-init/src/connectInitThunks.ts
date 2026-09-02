import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type AnalyticsDep, events as sharedEvents } from '@suite-common/analytics';
import {
    type DeviceRootState,
    type LockDeviceDep,
    deviceActions,
    selectDevices,
    selectIsPendingTransportEvent,
    selectSelectedDevice,
} from '@suite-common/device';
import { type FirmwareRootState, selectEffectiveFirmwareChannel } from '@suite-common/firmware';
import {
    Feature,
    type MessageSystemRootState,
    parseTimeoutThresholdsPerModel,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import {
    type ConnectInitHooksDeps,
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
    type CallMethodPayload,
    type CreateLoggerDep,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { getSynchronize, isArrayMember } from '@trezor/utils';

import { blacklist } from './blacklist';
import {
    type ConnectInitSettingsDep,
    type GetDebugSettingsDep,
    type TransportsDep,
} from './connectInitTypes';

const CONNECT_INIT_MODULE = '@common/connect-init';

// connectInitSettings is defined in the platform composition root:
// packages/suite/src/support/createSuiteCompositionRoot.ts or
// suite-native/state/src/createNativeCompositionRoot.ts.

export type ConnectInitThunkState = DeviceRootState &
    FirmwareRootState &
    MessageSystemRootState &
    WalletSettingsRootState;

export type ConnectInitThunkDeps = {
    actions: LockDeviceDep;
    services: {
        analytics: Pick<AnalyticsDep['analytics'], 'report'>;
    } & ConnectInitHooksDeps &
        ConnectInitSettingsDep &
        CreateLoggerDep &
        GetAllowPrereleaseDep &
        GetBinFilesBaseUrlDep &
        GetDebugSettingsDep &
        GetThpSettingsDep &
        ThpHostNameDep &
        TransportsDep;
};

export type ConnectInitThunkDispatch = ThunkDispatch<
    ConnectInitThunkState,
    ConnectInitThunkDeps,
    UnknownAction
>;

export const connectInitThunk = createThunk<
    void,
    void,
    { state: ConnectInitThunkState; extra: ConnectInitThunkDeps }
>(`${CONNECT_INIT_MODULE}/initThunk`, async (_, { dispatch, getState, extra }) => {
    const {
        actions: { lockDevice },
        services: {
            connectInitSettings,
            connectInitHooks,
            analytics,
            createLogger,
            thpHostName,
            createTransports,
            getAllowPrerelease,
            getBinFilesBaseUrl,
            getDebugSettings,
            getThpSettings,
        },
    } = extra;

    // set event listeners and dispatch as
    TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
        if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
            // This special case here allows us to "inject" extra data into action's payload
            // and change the type of the action (in this case DeviceEvent type !== Redux Action type)
            const connectedDevices = selectDevices(getState());
            dispatch(deviceConnectThunk({ type: eventData.type, device: eventData.payload }));

            connectInitHooks.deviceEvent[eventData.type]?.(eventData.payload, connectedDevices);
        } else {
            // dispatch event as action
            dispatch({ type: eventData.type, payload: eventData.payload });

            if (eventData.type === DEVICE.THP_PAIRING_STATUS_CHANGED) {
                const { status } = eventData.payload;
                if (status === 'finished' || status === 'canceled') {
                    analytics.report({
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
        dispatch(defaultTrezorUIEventHandlerThunk(action));
    });

    TrezorConnect.on(UI_REQUEST, ({ event: _, ...action }) => {
        // A bare `callId` is not proof of ownership — it doubles as the
        // cancellation token — so defer only events a scoped flow has registered.
        if ('callId' in action && action.callId && isScopedCallId(action.callId)) {
            return;
        }
        dispatch(defaultTrezorUIEventHandlerThunk(action));
    });

    TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    const synchronize = getSynchronize();

    const original = TrezorConnect.call.bind(TrezorConnect);
    TrezorConnect.call = async (params: CallMethodPayload) => {
        if (isArrayMember(params.method, blacklist)) {
            return original(params);
        }

        dispatch(lockDevice(true));

        const result = await synchronize(() => original(params));

        dispatch(lockDevice(false));
        dispatch(
            deviceActions.removeButtonRequests({
                // todo: device not 'thread safe' - meaning that device to which button requests have been added to might not
                // be the same re-selected device from this line. We should reuse device from params.
                device: selectSelectedDevice(getState()),
            }),
        );

        return result;
    };

    const binFilesBaseUrl = getBinFilesBaseUrl();

    const firmwareHashCheckTimeoutsOverride = parseTimeoutThresholdsPerModel(
        selectFeatureConfig(getState(), Feature.firmwareHashCheckTimeout),
    );
    const firmwareHashCheckTimeouts = {
        ...connectInitSettings.firmwareHashCheckTimeouts,
        ...firmwareHashCheckTimeoutsOverride,
    };

    const { transports: debugTransports, showConnectLogs, definitionsChannel } = getDebugSettings();
    const thp = getThpSettings();
    // desktop thp appName/hostName enhanced in ./packages/suite-desktop-core/src/modules/trezor-connect.ts
    if (thpHostName !== undefined) {
        thp.hostName = thpHostName;
    }

    try {
        await TrezorConnect.init({
            ...connectInitSettings,
            binFilesBaseUrl,
            pendingTransportEvent: selectIsPendingTransportEvent(getState()),
            transports: createTransports(debugTransports),
            thp,
            debug: showConnectLogs,
            createLogger,
            firmwareHashCheckTimeouts,
            firmwareChannel: selectEffectiveFirmwareChannel(getState(), getAllowPrerelease()),
            definitionsChannel,
            // Suite's enabled coins, declared to Connect one-way (Suite is the source of truth).
            enabledNetworks: selectEnabledNetworks(getState()).map(coin => ({
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
});
