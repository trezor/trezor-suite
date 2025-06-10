import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    deviceActions,
    deviceConnectThunks,
    selectDevices,
    selectEnabledNetworks,
    selectIsPendingTransportEvent,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    Device,
    TRANSPORT_EVENT,
    UI,
    UI_EVENT,
} from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { DATA_URL } from '@trezor/urls';
import { getSynchronize } from '@trezor/utils';

import { cardanoConnectPatch } from './cardanoConnectPatch';

const CONNECT_INIT_MODULE = '@common/connect-init';

// If you are looking where connectInitSettings is defined, it is defined in packages/suite/src/support/extraDependencies.ts
// or in suite-native/state/src/extraDependencies.ts depends on which platform this connectInitThunk runs.

type ConnectInitHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
> &
    Partial<Record<typeof UI.INVALID_PIN_ATTEMPTS_DEPLETED, () => void>>;

export const connectInitThunk = createThunk<void, ConnectInitHooks | void, void>(
    `${CONNECT_INIT_MODULE}/initThunk`,
    async (connectInitHooks, { dispatch, getState, extra }) => {
        const {
            selectors: { selectDebugSettings },
            actions: { lockDevice },
            utils: { connectInitSettings },
        } = extra;

        const getEnabledNetworks = () => selectEnabledNetworks(getState());

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
            }
        });

        TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
            if (action.type === 'ui-select_device') {
                // this is why you received the ui-select_device event.
                console.warn(
                    'Hey, it looks like you called a TrezorConnect method without providing device property.',
                );
            }

            if (
                action.type === 'ui-close_window'
                // && getState().wallet.discovery[getState().device?.selectedDevice?.path]?.status ==='progress'
            ) {
                // return;
            }

            // dispatch event as action
            dispatch(action);

            // this switch is still one more layer of indirection to be removed. connect actions are dispatched
            // and could be handled directly in reducers
            switch (action.type) {
                case UI.REQUEST_PIN:
                case UI.INVALID_PIN:
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
                case UI.REQUEST_BUTTON: {
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
                action.type === UI.INVALID_PIN_ATTEMPTS_DEPLETED &&
                connectInitHooks &&
                UI.INVALID_PIN_ATTEMPTS_DEPLETED in connectInitHooks
            ) {
                connectInitHooks?.[UI.INVALID_PIN_ATTEMPTS_DEPLETED]?.();
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

        const wrappedMethods: Array<keyof typeof TrezorConnect> = [
            'applySettings',
            'authenticateDevice',
            'authorizeCoinjoin',
            'backupDevice',
            'cancelCoinjoinAuthorization',
            'cardanoGetAddress',
            'cardanoGetPublicKey',
            'cardanoSignTransaction',
            'changePin',
            'cipherKeyValue',
            'discoverAccounts',
            'ethereumGetAddress',
            'ethereumSignTransaction',
            'getAddress',
            'getDeviceState',
            'getFeatures',
            'getOwnershipProof',
            'getPublicKey',
            'pushTransaction',
            'recoveryDevice',
            'resetDevice',
            'rippleGetAddress',
            'rippleSignTransaction',
            'setBusy',
            'showDeviceTutorial',
            'signTransaction',
            'solanaGetAddress',
            'solanaSignTransaction',
            'unlockPath',
            'wipeDevice',
        ] as const;

        wrappedMethods.forEach(key => {
            // typescript complains about params and return type, need to be "any"
            const original: any = TrezorConnect[key];
            if (!original) return;
            (TrezorConnect[key] as any) = async (params: any) => {
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
        });

        cardanoConnectPatch(getEnabledNetworks);

        const binFilesBaseUrl = isDesktop()
            ? extra.selectors.selectDesktopBinDir(getState())
            : DATA_URL;

        const { transports, showConnectLogs } = selectDebugSettings(getState());
        try {
            await TrezorConnect.init({
                ...connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
                transports,
                debug: showConnectLogs,
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
