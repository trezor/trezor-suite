import { type AnalyticsDep, events as sharedEvents } from '@suite-common/analytics';
import { type ConnectInitSettingsDep, blacklist } from '@suite-common/connect-init';
import {
    type DeviceRootState,
    type LockDeviceDep,
    deviceActions,
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
import { type DispatchDep } from '@suite-common/redux-utils';
import {
    type ConnectInit,
    type GetAllowPrereleaseDep,
    type GetBinFilesBaseUrlDep,
    type TrezorUiEventHandlerDep,
} from '@suite-common/suite-types';
import { type GetThpSettingsDep } from '@suite-common/thp';
import {
    type WalletSettingsRootState,
    deviceConnectThunk,
    isScopedCallId,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    type CallMethodPayload,
    type ConnectSettings,
    type CreateLoggerDep,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { getSynchronize, isArrayMember } from '@trezor/utils';

export type NativeConnectInitState = DeviceRootState &
    FirmwareRootState &
    MessageSystemRootState &
    WalletSettingsRootState;

export type NativeConnectInitDeps = {
    getState: () => NativeConnectInitState;
    analytics: Pick<AnalyticsDep['analytics'], 'report'>;
    createTransports: () => ConnectSettings['transports'];
} & DispatchDep &
    LockDeviceDep &
    ConnectInitSettingsDep &
    CreateLoggerDep &
    GetAllowPrereleaseDep &
    GetBinFilesBaseUrlDep &
    GetThpSettingsDep &
    TrezorUiEventHandlerDep;

export const createNativeConnectInit =
    (deps: NativeConnectInitDeps): ConnectInit =>
    async () => {
        TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
            if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
                deps.dispatch(
                    deviceConnectThunk({ type: eventData.type, device: eventData.payload }),
                );
            } else {
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
            deps.trezorUiEventHandler(action);
        });

        TrezorConnect.on(UI_REQUEST, ({ event: _, ...action }) => {
            if ('callId' in action && action.callId && isScopedCallId(action.callId)) {
                return;
            }
            deps.trezorUiEventHandler(action);
        });

        TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
            deps.dispatch(action);
        });

        TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
            deps.dispatch(action);
        });

        const synchronize = getSynchronize();

        const original = TrezorConnect.call.bind(TrezorConnect);
        TrezorConnect.call = async (params: CallMethodPayload) => {
            if (isArrayMember(params.method, blacklist)) {
                return original(params);
            }

            deps.dispatch(deps.lockDevice(true));

            const result = await synchronize(() => original(params));

            deps.dispatch(deps.lockDevice(false));
            deps.dispatch(
                deviceActions.removeButtonRequests({
                    device: selectSelectedDevice(deps.getState()),
                }),
            );

            return result;
        };

        const firmwareHashCheckTimeoutsOverride = parseTimeoutThresholdsPerModel(
            selectFeatureConfig(deps.getState(), Feature.firmwareHashCheckTimeout),
        );

        try {
            await TrezorConnect.init({
                ...deps.connectInitSettings,
                binFilesBaseUrl: deps.getBinFilesBaseUrl(),
                pendingTransportEvent: selectIsPendingTransportEvent(deps.getState()),
                transports: deps.createTransports(),
                thp: deps.getThpSettings(),
                createLogger: deps.createLogger,
                firmwareHashCheckTimeouts: {
                    ...deps.connectInitSettings.firmwareHashCheckTimeouts,
                    ...firmwareHashCheckTimeoutsOverride,
                },
                firmwareChannel: selectEffectiveFirmwareChannel(
                    deps.getState(),
                    deps.getAllowPrerelease(),
                ),
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
