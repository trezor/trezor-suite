/* @flow */
import TrezorConnect, {
    DEVICE, DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT,
} from 'trezor-connect';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as NOTIFICATION from 'actions/constants/notification';
import { getDuplicateInstanceNumber } from 'reducers/utils';
import * as RouterActions from 'actions/RouterActions';

import type {
    DeviceMessage,
    DeviceMessageType,
    UiMessage,
    UiMessageType,
    TransportMessage,
    TransportMessageType,
    BlockchainMessage,
    BlockchainMessageType,
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
    type: typeof CONNECT.COIN_CHANGED,
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
    type: typeof CONNECT.FORGET_SINGLE,
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
};

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

    TrezorConnect.on(BLOCKCHAIN_EVENT, (event: BlockchainMessage): void => {
        // post event to reducers
        const type: BlockchainMessageType = event.type; // eslint-disable-line prefer-destructuring
        dispatch({
            type,
            payload: event.payload,
        });
    });

    /* global LOCAL */
    // $FlowIssue LOCAL not declared
    window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : 'https://sisyfos.trezor.io/connect/'; // eslint-disable-line no-underscore-dangle
    // window.__TREZOR_CONNECT_SRC = typeof LOCAL === 'string' ? LOCAL : 'https://connect.trezor.io/5/'; // eslint-disable-line no-underscore-dangle

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

export const getSelectedDeviceState = (): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
        useEmptyPassphrase: !selected.instance,
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
                            dispatch(getSelectedDeviceState());
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
            dispatch({
                type: CONNECT.REMEMBER_REQUEST,
                device: instances[0],
                instances,
            });
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

        const response = await TrezorConnect.getFeatures({
            device: {
                path: selected.path,
            },
            useEmptyPassphrase: !selected.instance,
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

export const duplicateDevice = (device: TrezorDevice): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // dispatch({
    //     type: CONNECT.TRY_TO_DUPLICATE,
    //     device,
    // });

    const instance: number = getDuplicateInstanceNumber(getState().devices, device);
    const extended: Object = { instance };
    dispatch({
        type: CONNECT.DUPLICATE,
        device: { ...device, ...extended },
    });
};
