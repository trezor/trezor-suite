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
import { type TrezorDevice } from '@suite-common/suite-types';
import { getBrowserName } from '@suite-common/suite-utils';
import { deviceConnectThunks, selectEnabledNetworks } from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    type Device,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';
import { isDesktop, isWeb } from '@trezor/env-utils';
import { DATA_URL } from '@trezor/urls';
import { capitalizeFirstLetter, getSynchronize } from '@trezor/utils';

import { blacklist } from './blacklist';
import { type ConnectKey, type ConnectWebKey } from './types';

const CONNECT_INIT_MODULE = '@common/connect-init';

// If you are looking where connectInitSettings is defined, it is defined in packages/suite/src/support/extraDependencies.ts
// or in suite-native/state/src/extraDependencies.ts depends on which platform this connectInitThunk runs.

type ConnectInitHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
> &
    Partial<
        Record<
            typeof UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED | typeof UI_REQUEST.REQUEST_WORD,
            () => void
        >
    >;

export const connectInitThunk = createThunk<void, ConnectInitHooks | void, void>(
    `${CONNECT_INIT_MODULE}/initThunk`,
    async (connectInitHooks, { dispatch, getState, extra }) => {
        const {
            selectors: { selectDebugSettings, selectThpSettings },
            actions: { lockDevice },
            services: { connectInitSettings, analytics },
        } = extra;

        const getEnabledNetworks = () => selectEnabledNetworks(getState());
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

                if (connectInitHooks && eventData.type in connectInitHooks) {
                    connectInitHooks[eventData.type]?.(eventData.payload, connectedDevices);
                }
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
            if (action.type === UI_REQUEST.FIRMWARE_DOWNLOADED) {
                // We are in web therefore we ignore `FIRMWARE_DOWNLOADED` action.
                return;
            }

            // dispatch event as action
            dispatch(action);

            // this switch is still one more layer of indirection to be removed. connect actions are dispatched
            // and could be handled directly in reducers
            switch (action.type) {
                case UI_REQUEST.REQUEST_PIN:
                case UI_REQUEST.INVALID_PIN:
                    dispatch(
                        deviceActions.addButtonRequest({
                            // todo: note that this is not 'threadsafe', currently selected device is not necessarily the device
                            // connect call was made for
                            device: selectSelectedDevice(getState()),
                            buttonRequest: {
                                code: action.payload.type ? action.payload.type : action.type,
                            },
                        }),
                    );
                    break;
                case UI_REQUEST.REQUEST_BUTTON: {
                    const { device: _, ...request } = action.payload;
                    dispatch(
                        deviceActions.addButtonRequest({
                            device: selectSelectedDevice(getState()),
                            buttonRequest: request,
                        }),
                    );
                    break;
                }
            }

            if (
                connectInitHooks &&
                (action.type === UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED ||
                    action.type === UI_REQUEST.REQUEST_WORD)
            ) {
                connectInitHooks[action.type]?.();
            }
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

        Object.keys(TrezorConnect)
            .filter(k => !blacklist.includes(k as ConnectWebKey))
            .forEach(key => {
                // typescript complains about params and return type, need to be "any"
                const original: any = TrezorConnect[key as ConnectKey];
                if (!original) return;
                (TrezorConnect[key as ConnectKey] as any) = async (params: any) => {
                    dispatch(lockDevice(true));

                    // cardano patch
                    const enabledNetworks = getEnabledNetworks();
                    const isCardanoMethod =
                        key === 'call'
                            ? params.method.startsWith('cardano')
                            : key.startsWith('cardano');
                    const cardanoEnabled = enabledNetworks.includes('ada') || isCardanoMethod;

                    const result = await synchronize(() =>
                        original({ ...params, useCardanoDerivation: cardanoEnabled }),
                    );

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
            });

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

        const { transports, showConnectLogs } = selectDebugSettings(getState());
        const thp = selectThpSettings(getState());
        // desktop thp appName/hostName enhanced in ./packages/suite-desktop-core/src/modules/trezor-connect.ts
        if (isWeb()) {
            thp.hostName = capitalizeFirstLetter(getBrowserName());
        }

        try {
            await TrezorConnect.init({
                ...connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
                transports,
                thp,
                debug: showConnectLogs,
                firmwareHashCheckTimeouts,
                firmwareChannel: getEffectiveFirmwareChannel(getState()),
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
