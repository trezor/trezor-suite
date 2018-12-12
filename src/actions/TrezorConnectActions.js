/* @flow */
import TrezorConnect, {
    DEVICE, DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT,
} from 'trezor-connect';
import { CONTEXT_NONE } from 'actions/constants/modal';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as NOTIFICATION from 'actions/constants/notification';
import { getDuplicateInstanceNumber } from 'reducers/utils';
import * as RouterActions from 'actions/RouterActions';
import * as deviceUtils from 'utils/device';
import * as buildUtils from 'utils/build';

import type {
    DeviceMessage,
    DeviceMessageType,
    UiMessage,
    UiMessageType,
    TransportMessage,
    TransportMessageType,
    BlockchainEvent,
} from 'trezor-connect';

import type {
    Dispatch,
    GetState,
    Action,
    ThunkAction,
    AsyncAction,
    Device,
    TrezorDevice,
} from 'flowtype';


export type TrezorConnectAction = {
    type: typeof CONNECT.INITIALIZATION_ERROR,
    error: string
} | {
    type: typeof CONNECT.NETWORK_CHANGED,
    payload: {
        network: string
    }
} | {
    type: typeof CONNECT.AUTH_DEVICE,
    device: TrezorDevice,
    state: string
} | {
    type: typeof CONNECT.DUPLICATE,
    device: TrezorDevice
} | {
    type: typeof CONNECT.REMEMBER_REQUEST,
    device: TrezorDevice,
    instances: Array<TrezorDevice>
} | {
    type: typeof CONNECT.DISCONNECT_REQUEST,
    device: TrezorDevice
} | {
    type: typeof CONNECT.FORGET_REQUEST,
    device: TrezorDevice
} | {
    type: typeof CONNECT.FORGET,
    device: TrezorDevice
} | {
    type: typeof CONNECT.FORGET_SINGLE | typeof CONNECT.FORGET_SILENT,
    device: TrezorDevice
} | {
    type: typeof CONNECT.REMEMBER,
    device: TrezorDevice
} | {
    type: typeof CONNECT.TRY_TO_DUPLICATE,
    device: TrezorDevice
} | {
    type: typeof CONNECT.DEVICE_FROM_STORAGE,
    payload: Array<TrezorDevice>
} | {
    type: typeof CONNECT.START_ACQUIRING | typeof CONNECT.STOP_ACQUIRING,
} | {
    type: typeof CONNECT.REQUEST_WALLET_TYPE,
    device: TrezorDevice
} | {
    type: typeof CONNECT.RECEIVE_WALLET_TYPE | typeof CONNECT.UPDATE_WALLET_TYPE,
    device: TrezorDevice,
    hidden: boolean,
};

declare var LOCAL: ?string;

export const init = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // set listeners
    TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
        // post event to reducers
        const type: DeviceMessageType = event.type; // eslint-disable-line prefer-destructuring
        dispatch({
            type,
            device: event.payload,
        });
    });

    TrezorConnect.on(UI_EVENT, (event: UiMessage): void => {
        // post event to reducers
        const type: UiMessageType = event.type; // eslint-disable-line prefer-destructuring
        dispatch({
            type,
            payload: event.payload,
        });
    });

    TrezorConnect.on(TRANSPORT_EVENT, (event: TransportMessage): void => {
        // post event to reducers
        const type: TransportMessageType = event.type; // eslint-disable-line prefer-destructuring
        dispatch({
            type,
            payload: event.payload,
        });
    });

    // post event to reducers
    TrezorConnect.on(BLOCKCHAIN_EVENT, (event: BlockchainEvent): void => {
        dispatch(event);
    });

    if (buildUtils.isDev()) {
        window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : 'https://sisyfos.trezor.io/connect/'; // eslint-disable-line no-underscore-dangle
        // window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : 'https://connect.trezor.io/5/'; // eslint-disable-line no-underscore-dangle
        window.TrezorConnect = TrezorConnect;
    }

    try {
        await TrezorConnect.init({
            transportReconnect: true,
            debug: false,
            popup: false,
            webusb: true,
            pendingTransportEvent: (getState().devices.length < 1),
        });
    } catch (error) {
        dispatch({
            type: CONNECT.INITIALIZATION_ERROR,
            error,
        });
    }
};

// called after backend was initialized
// set listeners for connect/disconnect
export const postInit = (): ThunkAction => (dispatch: Dispatch): void => {
    const handleDeviceConnect = (device: Device) => {
        dispatch(RouterActions.selectDevice(device));
    };

    TrezorConnect.off(DEVICE.CONNECT, handleDeviceConnect);
    TrezorConnect.off(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

    TrezorConnect.on(DEVICE.CONNECT, handleDeviceConnect);
    TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

    // try to redirect to initial url
    if (!dispatch(RouterActions.setInitialUrl())) {
        // if initial redirection fails try to switch to first available device
        dispatch(RouterActions.selectFirstAvailableDevice());
    }
};

export const requestWalletType = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;
    const isDeviceReady = selected.connected && selected.features && !selected.state && selected.mode === 'normal' && selected.firmware !== 'required';
    if (!isDeviceReady) return;

    if (selected.features && selected.features.passphrase_protection) {
        dispatch({
            type: CONNECT.REQUEST_WALLET_TYPE,
            device: selected,
        });
    } else {
        dispatch({
            type: CONNECT.RECEIVE_WALLET_TYPE,
            device: selected,
            hidden: false,
            state: selected.state,
        });
    }
};

export const authorizeDevice = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;
    const isDeviceReady = selected.connected && selected.features && !selected.state && selected.mode === 'normal' && selected.firmware !== 'required';
    if (!isDeviceReady) return;

    const response = await TrezorConnect.getDeviceState({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        useEmptyPassphrase: selected.useEmptyPassphrase,
    });

    if (response && response.success) {
        dispatch({
            type: CONNECT.AUTH_DEVICE,
            device: selected,
            state: response.payload.state,
        });
    } else {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                devicePath: selected.path,
                type: 'error',
                title: 'Authentication error',
                message: response.payload.error,
                cancelable: false,
                actions: [
                    {
                        label: 'Try again',
                        callback: () => {
                            dispatch({
                                type: NOTIFICATION.CLOSE,
                                payload: { devicePath: selected.path },
                            });
                            dispatch(authorizeDevice());
                        },
                    },
                ],
            },
        });
    }
};

export const deviceDisconnect = (device: Device): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    if (device.features) {
        const instances = getState().devices.filter(d => d.features && device.features && d.state && !d.remember && d.features.device_id === device.features.device_id);
        if (instances.length > 0) {
            const isSelected = deviceUtils.isSelectedDevice(getState().wallet.selectedDevice, device);
            if (!isSelected && getState().modal.context !== CONTEXT_NONE) {
                dispatch({
                    type: CONNECT.FORGET_SILENT,
                    device: instances[0],
                });
            } else {
                dispatch({
                    type: CONNECT.REMEMBER_REQUEST,
                    device: instances[0],
                    instances,
                });
            }
        } else {
            dispatch(RouterActions.selectFirstAvailableDevice());
        }
    } else {
        dispatch(RouterActions.selectFirstAvailableDevice());
    }
};

export function reload(): AsyncAction {
    return async (): Promise<void> => {
    };
}

export function acquire(): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const selected: ?TrezorDevice = getState().wallet.selectedDevice;
        if (!selected) return;

        dispatch({
            type: CONNECT.START_ACQUIRING,
        });

        // this is the only place where useEmptyPassphrase should be used every time
        // the goal here is to acquire device and get his features
        // authentication (passphrase) is not needed here yet
        const response = await TrezorConnect.getFeatures({
            device: {
                path: selected.path,
            },
            useEmptyPassphrase: true,
        });

        if (!response.success) {
            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Acquire device error',
                    message: response.payload.error,
                    cancelable: true,
                    // actions: [
                    //     {
                    //         label: 'Try again',
                    //         callback: () => {
                    //             dispatch(acquire())
                    //         }
                    //     }
                    // ]
                },
            });
        }

        dispatch({
            type: CONNECT.STOP_ACQUIRING,
        });
    };
}

// called from Aside - device menu (forget single instance)
export const forget = (device: TrezorDevice): Action => ({
    type: CONNECT.FORGET_REQUEST,
    device,
});

export const duplicateDeviceOld = (device: TrezorDevice): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const instance: number = getDuplicateInstanceNumber(getState().devices, device);
    const extended: Object = { instance };
    dispatch({
        type: CONNECT.DUPLICATE,
        device: { ...device, ...extended },
    });
};

export const duplicateDevice = (device: TrezorDevice): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    dispatch({
        type: CONNECT.REQUEST_WALLET_TYPE,
        device,
    });
};
