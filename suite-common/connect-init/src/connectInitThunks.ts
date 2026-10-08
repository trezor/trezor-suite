import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type AnalyticsDep, events as sharedEvents } from '@suite-common/analytics';
import {
    type DeviceRootState,
    deviceActions,
    selectDeviceByState,
    selectDevices,
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
    type ConnectInitDeviceEventHooksDep,
    type GetAllowPrereleaseDep,
    type GetBinFilesBaseUrlDep,
    type LockDeviceDep,
} from '@suite-common/suite-types';
import { type GetThpSettingsDep, type ThpHostNameDep } from '@suite-common/thp';
import {
    type DefaultTrezorUIEventHandlerThunkDeps,
    type WalletSettingsRootState,
    defaultTrezorUIEventHandlerThunk,
    deviceConnectThunk,
    isScopedCallId,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    type CallMethodPayload,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_EVENTS,
    UI_REQUEST,
} from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import type { CreateLoggerDep } from '@trezor/logger';

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
    services: {
        analytics: Pick<AnalyticsDep['analytics'], 'report'>;
    } & ConnectInitDeviceEventHooksDep &
        ConnectInitSettingsDep &
        CreateLoggerDep &
        GetAllowPrereleaseDep &
        GetBinFilesBaseUrlDep &
        GetDebugSettingsDep &
        GetThpSettingsDep &
        LockDeviceDep &
        ThpHostNameDep &
        TransportsDep;
} & DefaultTrezorUIEventHandlerThunkDeps;

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
        services: {
            connectInitSettings,
            connectInitDeviceEventHooks,
            analytics,
            createLogger,
            thpHostName,
            createTransports,
            getAllowPrerelease,
            getBinFilesBaseUrl,
            getDebugSettings,
            getThpSettings,
            lockDevice,
        },
    } = extra;

    // The TrezorConnect.call wrapper below locks the device UI optimistically on every call (keyed by
    // callId); connect-core releases it via DEVICE_UNLOCK. Track locked callIds so the event handler
    // and the wrapper's safety net each release a given lock exactly once.
    const optimisticallyLockedCallIds = new Set<string>();
    const releaseOptimisticLock = (callId?: string) => {
        if (callId !== undefined && optimisticallyLockedCallIds.delete(callId)) {
            lockDevice(false);
        }
    };

    // set event listeners and dispatch as
    TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
        if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
            // This special case here allows us to "inject" extra data into action's payload
            // and change the type of the action (in this case DeviceEvent type !== Redux Action type)
            const connectedDevices = selectDevices(getState());
            dispatch(deviceConnectThunk({ type: eventData.type, device: eventData.payload }));

            connectInitDeviceEventHooks[eventData.type]?.(eventData.payload, connectedDevices);
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
        // Connect-core releases the host's optimistic device lock (see the TrezorConnect.call wrapper)
        // by callId. Handle it before the scoped-callId guard below — the release is process-global and
        // must run even for a device call made inside a scoped flow (e.g. passphrase-wallet discovery).
        if (action.type === UI_EVENTS.DEVICE_UNLOCK) {
            releaseOptimisticLock(action.payload.callId);
            if (action.payload.device) {
                dispatch(
                    deviceActions.removeButtonRequests({
                        // Clear button requests for the device the finished call actually used (carried
                        // on the event), falling back to the selected device. Note: addButtonRequest
                        // still keys off the selected device, so full add/remove symmetry is a follow-up.
                        device:
                            selectDeviceByState(getState(), action.payload.device.state) ??
                            selectSelectedDevice(getState()),
                    }),
                );
            }

            return;
        }

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

    // Lock the device UI synchronously the moment a call is issued — before it crosses the desktop IPC
    // boundary or lazy-loads a coin-method chunk, either of which would otherwise delay the lock by a
    // full round-trip. useDevice isn't known here yet, so lock optimistically on every call;
    // connect-core releases it via DEVICE_UNLOCK as soon as it knows the call doesn't hold the device
    // (and, for a real device call, once the operation is done). The callId ties the lock to that
    // release; generate one when the host didn't provide it so it is known here synchronously — it is
    // also the identity connect uses to cancel the call.
    const original = TrezorConnect.call.bind(TrezorConnect);
    TrezorConnect.call = (params: CallMethodPayload) => {
        const callId = params.callId ?? crypto.randomUUID();
        optimisticallyLockedCallIds.add(callId);
        lockDevice(true);

        // Safety net: release if the call settles without a DEVICE_UNLOCK (e.g. it failed before the
        // method was built). releaseOptimisticLock is idempotent, so it never double-releases.
        return Promise.resolve(original({ ...params, callId })).finally(() =>
            releaseOptimisticLock(callId),
        );
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
    // desktop thp appName/hostName enhanced in ./suite/desktop-app-main/src/modules/trezor-connect.ts
    if (thpHostName !== undefined) {
        thp.hostName = thpHostName;
    }

    try {
        await TrezorConnect.init({
            ...connectInitSettings,
            binFilesBaseUrl,
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
