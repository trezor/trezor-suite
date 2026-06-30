import { events as sharedEvents } from '@suite-common/analytics';
import {
    deviceActions,
    selectDevices,
    selectIsPendingTransportEvent,
    selectSelectedDevice,
} from '@suite-common/device';
import { selectEffectiveFirmwareChannel } from '@suite-common/firmware';
import {
    Feature,
    parseTimeoutThresholdsPerModel,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import {
    defaultTrezorUIEventHandlerThunk,
    deviceConnectThunks,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    type CallMethodPayload,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
} from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { DATA_URL } from '@trezor/urls';
import { getSynchronize, isArrayMember } from '@trezor/utils';

import { blacklist } from './blacklist';

const CONNECT_INIT_MODULE = '@common/connect-init';

// If you are looking where connectInitSettings is defined, it is defined in packages/suite/src/support/extraDependencies.ts
// or in suite-native/state/src/extraDependencies.ts depends on which platform this connectInitThunk runs.

export const connectInitThunk = createThunk<void, void, void>(
    `${CONNECT_INIT_MODULE}/initThunk`,
    async (_, { dispatch, getState, extra }) => {
        const {
            selectors: { selectDebugSettings, selectThpSettings },
            actions: { lockDevice },
            services: {
                connectInitSettings,
                connectInitHooks,
                analytics,
                createLogger,
                thpHostName,
            },
        } = extra;

        const getEffectiveFirmwareChannel = selectEffectiveFirmwareChannel(
            extra.selectors.selectAllowPrerelease,
        );

        // set event listeners and dispatch as
        TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
            if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
                // This special case here allows us to "inject" extra data into action's payload
                // and change the type of the action (in this case DeviceEvent type !== Redux Action type)
                const connectedDevices = selectDevices(getState());
                dispatch(deviceConnectThunks({ type: eventData.type, device: eventData.payload }));

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
            if ('callId' in action && action.callId) {
                console.warn(
                    `[connect-init] UI_EVENT ${action.type} (callId=${action.callId}) swallowed in global scope — handled by a scoped flow.`,
                );

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

        const binFilesBaseUrl = isDesktop()
            ? extra.selectors.selectDesktopBinDir(getState())
            : DATA_URL;

        const firmwareHashCheckTimeoutsOverride = parseTimeoutThresholdsPerModel(
            selectFeatureConfig(getState(), Feature.firmwareHashCheckTimeout),
        );
        const firmwareHashCheckTimeouts = {
            ...connectInitSettings.firmwareHashCheckTimeouts,
            ...firmwareHashCheckTimeoutsOverride,
        };

        const { transports, showConnectLogs, definitionsChannel } = selectDebugSettings(getState());
        const thp = selectThpSettings(getState());
        // desktop thp appName/hostName enhanced in ./packages/suite-desktop-core/src/modules/trezor-connect.ts
        if (thpHostName !== undefined) {
            thp.hostName = thpHostName;
        }

        try {
            await TrezorConnect.init({
                ...connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
                transports,
                thp,
                debug: showConnectLogs,
                createLogger,
                firmwareHashCheckTimeouts,
                firmwareChannel: getEffectiveFirmwareChannel(getState()),
                definitionsChannel,
                // Suite's enabled coins, declared to Connect one-way (Suite is the source of truth).
                enabledNetworks: selectEnabledNetworks(getState()).map(coin => ({ coin })),
            });
        } catch (error) {
            let formattedError: string;
            if (typeof error === 'string') {
                formattedError = error;
            } else {
                formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
            }
            throw new Error(formattedError);
        }
    },
);
