/* @flow */
'use strict';

import TrezorConnect, { UI, DEVICE, DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT } from 'trezor-connect';
import * as ADDRESS from './constants/address';
import * as TOKEN from './constants/token';
import * as CONNECT from './constants/TrezorConnect';
import * as NOTIFICATION from './constants/notification';
import * as WALLET from './constants/wallet';

import { push } from 'react-router-redux';
import * as DiscoveryActions from './DiscoveryActions';
import { resolveAfter } from '../utils/promiseUtils';
import { getAccounts } from '../utils/reducerUtils';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';


import type {
    Device,
    ResponseMessage,
    DeviceMessage,
    UiMessage,
    TransportMessage,
    DeviceMessageType,
    TransportMessageType,
    UiMessageType
} from 'trezor-connect';

import type { 
    Dispatch,
    GetState,
    Action,
    AsyncAction,
    TrezorDevice,
    RouterLocationState
} from '../flowtype';


export type TrezorConnectAction = {
    type: typeof CONNECT.INITIALIZATION_ERROR,
    error: string
} | {
    type: typeof CONNECT.SELECT_DEVICE,
    payload: ?{
        id: string,
        instance: string
    }
} | {
    type: typeof CONNECT.COIN_CHANGED,
    payload: {
        network: string
    }
} | {
    type: typeof CONNECT.AUTH_DEVICE,
    device: TrezorDevice
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
    type: typeof CONNECT.START_ACQUIRING,
    device: TrezorDevice
} | {
    type: typeof CONNECT.STOP_ACQUIRING,
    device: TrezorDevice
};


export const init = (): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // set listeners 
        TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
            // post event to reducers
            const type: DeviceMessageType = event.type; // assert flow type
            dispatch({
                type,
                device: event.payload
            });
        });

        TrezorConnect.on(UI_EVENT, (event: UiMessage): void => {
            // post event to reducers
            const type: UiMessageType = event.type; // assert flow type
            dispatch({
                type,
                payload: event.payload
            });
        });

        TrezorConnect.on(TRANSPORT_EVENT, (event: TransportMessage): void => {
            // post event to reducers
            const type: TransportMessageType = event.type; // assert flow type
            dispatch({
                type,
                payload: event.payload
            });
        });

        try {
            await TrezorConnect.init({
                transportReconnect: true,
                connectSrc: 'https://localhost:8088/',
                // connectSrc: 'https://connect.trezor.io/tpm/',
                // connectSrc: 'https://sisyfos.trezor.io/',
                debug: false,
                popup: false,
                webusb: true
            });
        } catch (error) {
            dispatch({
                type: CONNECT.INITIALIZATION_ERROR,
                error
            })
        }
    }
}

// called after backend was initialized
// set listeners for connect/disconnect
export const postInit = (): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const handleDeviceConnect = (device: Device) => {
            dispatch( initConnectedDevice(device) );
        }

        TrezorConnect.off(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.off(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        TrezorConnect.on(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        // const devices: Array<TrezorDevice> = getState().connect.devices;
        const devices: Array<TrezorDevice> = getState().connect.devices;

        const { initialPathname, initialParams } = getState().wallet;

        if (initialPathname) {
            dispatch({
                type: WALLET.SET_INITIAL_URL,
                pathname: null,
                params: null
            });
        }

        if (devices.length > 0) {
            const unacquired: ?TrezorDevice = devices.find(d => d.unacquired);
            if (unacquired) {
                dispatch( onSelectDevice(unacquired) );
            } else {
                const latest: Array<TrezorDevice> = sortDevices(devices);
                const firstConnected: ?TrezorDevice = latest.find(d => d.connected);
                dispatch( onSelectDevice(firstConnected || latest[0]) );

                // TODO
                if (initialParams) {
                    if (!initialParams.hasOwnProperty("network") && initialPathname !== getState().router.location.pathname) {
                        // dispatch( push(initialPathname) );
                    } else {
                        
                    }
                }
            }
        }
    }
}

const sortDevices = (devices: Array<TrezorDevice>): Array<TrezorDevice> => {
    return devices.sort((a, b) => {
        if (!a.ts || !b.ts) {
            return -1;
        } else {
            return a.ts > b.ts ? -1 : 1;
        }
    });
}

export const initConnectedDevice = (device: any): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const selected = findSelectedDevice(getState().connect);
        if (!selected || (selected && selected.state)) {
            dispatch( onSelectDevice(device) );
        }
        // if (device.unacquired && selected && selected.path !== device.path && !selected.connected) {
        //     dispatch( onSelectDevice(device) );
        // } else if (!selected) {
        //     dispatch( onSelectDevice(device) );
        // }
    }
}

// selection from Aside dropdown button
// after device_connect event
// or after acquiring device
// device type could be local TrezorDevice or Device (from trezor-connect device_connect event)
export const onSelectDevice = (device: TrezorDevice | Device): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        // || device.isUsedElsewhere

        // switch to initial url and reset this value
        

        if (!device.features) {
            dispatch( push(`/device/${ device.path }/acquire`) );
        } else if (device.features.bootloader_mode) {
            dispatch( push(`/device/${ device.path }/bootloader`) );
        } else if (typeof device.instance === 'number') {
            dispatch( push(`/device/${ device.features.device_id }:${ device.instance }`) );
        } else {

            const deviceId: string = device.features.device_id;
            const urlParams: RouterLocationState = getState().router.location.state;
            // let url: string = `/device/${ device.features.device_id }/network/ethereum/address/0`;
            let url: string = `/device/${ deviceId }`;
            let instance: ?number;
            // check if device is not TrezorDevice type
            if (!device.hasOwnProperty('ts')) {
                // its device from trezor-connect (called in initConnectedDevice triggered by device_connect event)
                // need to lookup if there are unavailable instances
                const available: Array<TrezorDevice> = getState().connect.devices.filter(d => d.path === device.path);
                const latest: Array<TrezorDevice> = sortDevices(available);

                if (latest.length > 0 && latest[0].instance) {
                    url += `:${ latest[0].instance }`;
                    instance = latest[0].instance;
                }
            }
            // check if current location is not set to this device
            //dispatch( push(`/device/${ device.features.device_id }/network/etc/address/0`) );
            
            if (urlParams.deviceInstance !== instance || urlParams.device !== deviceId) {
                dispatch( push(url) );
            }
        }
    }
}

export const switchToFirstAvailableDevice = (): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const { devices } = getState().connect;
        if (devices.length > 0) {
            // TODO: Priority:
            // 1. First Unacquired
            // 2. First connected
            // 3. Saved with latest timestamp
            const unacquired = devices.find(d => d.unacquired);
            if (unacquired) {
                dispatch( initConnectedDevice(unacquired) );
            } else {
                const latest: Array<TrezorDevice> = sortDevices(devices);
                const firstConnected: ?TrezorDevice = latest.find(d => d.connected);
                dispatch( onSelectDevice(firstConnected || latest[0]) );
            }
        } else {
            dispatch( push('/') );
            dispatch({
                type: CONNECT.SELECT_DEVICE,
                payload: null
            })
        }
    }
}


export const getSelectedDeviceState = (): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const selected = findSelectedDevice(getState().connect);
        console.warn("init selected", selected)
        if (selected 
            && selected.connected
            && selected.features
            && !selected.acquiring 
            && !selected.state) {

            const response = await TrezorConnect.getDeviceState({ 
                device: {
                    path: selected.path,
                    instance: selected.instance,
                    state: selected.state
                }
            });

            if (response && response.success) {
                dispatch({
                    type: CONNECT.AUTH_DEVICE,
                    device: selected,
                    state: response.payload.state
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
                                    dispatch( {
                                        type: NOTIFICATION.CLOSE,
                                        payload: { devicePath: selected.path }
                                    });
                                    dispatch( getSelectedDeviceState() );
                                }
                            }
                        ]
                    }
                });
            }
        }
    }
}

export const deviceDisconnect = (device: Device): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const selected: ?TrezorDevice = findSelectedDevice(getState().connect);

        if (device && device.features) {
            if (selected && selected.features && selected.features.device_id === device.features.device_id) {
                dispatch( DiscoveryActions.stop(selected) );
            }

            const instances = getState().connect.devices.filter(d => d.features && d.state && !d.remember && d.features.device_id === device.features.device_id);
            if (instances.length > 0) {
                dispatch({
                    type: CONNECT.REMEMBER_REQUEST,
                    device,
                    instances,
                });
            }
        }

        if (!selected) {
            dispatch( switchToFirstAvailableDevice() );
        }

    }
}

export const coinChanged = (network: ?string): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const selected: ?TrezorDevice = findSelectedDevice(getState().connect);
        if (!selected) return;

        dispatch( DiscoveryActions.stop(selected) );

        if (network) {
            dispatch( DiscoveryActions.start(selected, network) );
        }
    }
}

export function reload(): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    }
}

export function acquire(): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const selected: ?TrezorDevice = findSelectedDevice(getState().connect);
        if (!selected) return;

        // const saved = getState().connect.devices.map(d => {
        //     if (d.state) {
        //         return {
        //             instance: d.instance,
        //             state: d.state
        //         }
        //     } else {
        //         return null;
        //     }
        // });

        //const response = await __acquire(selected.path, selected.instance);

        dispatch({
            type: CONNECT.START_ACQUIRING,
            device: selected
        });

        const response = await TrezorConnect.getFeatures({ 
            device: {
                path: selected.path,
            }
        });

        const selected2 = findSelectedDevice(getState().connect);
        dispatch({
            type: CONNECT.STOP_ACQUIRING,
            device: selected2
        });

        if (response && response.success) {
            dispatch({
                type: DEVICE.ACQUIRED,
                device: null
            })
        } else {
            // TODO: handle invalid pin?
            console.log("-error ack", response)

            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Acquire device error',
                    message: response.payload.error,
                    cancelable: true,
                    actions: [
                        {
                            label: 'Try again',
                            callback: () => {
                                dispatch(acquire())
                            }
                        }
                    ]
                }
            })
        }
    }
}

export const forgetDevice = (device: any): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        // find accounts associated with this device
        // const accounts: Array<any> = getState().accounts.find(a => a.deviceState === device.state);


        // find discovery processes associated with this device
        // const discovery: Array<any> = getState().discovery.find(d => d.deviceState === device.state);

    }
}

export const gotoDeviceSettings = (device: any): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        dispatch( push(`/device/${ device.features.device_id }/settings`) );
    }
}

// called from Aside - device menu (forget single instance)
export const forget = (device: TrezorDevice): Action => {
    return {
        type: CONNECT.FORGET_REQUEST,
        device
    };
}

export const duplicateDevice = (device: any): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        dispatch({
            type: CONNECT.TRY_TO_DUPLICATE,
            device
        })
    }
}

export const onDuplicateDevice = (): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const selected: ?TrezorDevice = findSelectedDevice(getState().connect);
        if (selected)
            dispatch(onSelectDevice(selected));
    }
}


export function addAddress(): AsyncAction {
    return (dispatch: Dispatch, getState: GetState): void => {
        const selected = findSelectedDevice(getState().connect);
        if (!selected) return;
        dispatch( DiscoveryActions.start(selected, getState().router.location.state.network, true) ); // TODO: network nicer
    }
}
