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

export const init = (): any => {
    return async (dispatch, getState): Promise<void> => {
        // set listeners 
        TrezorConnect.on(DEVICE_EVENT, (event: DeviceMessage): void => {
            dispatch({
                type: event.type,
                device: event.payload
            });
        });

        const version: Object = TrezorConnect.getVersion();
        TrezorConnect.on(UI_EVENT, (event: UiMessage): void => {
            // post event to reducers
            dispatch({
                type: event.type,
                payload: event.payload
            });
        });

        TrezorConnect.on(TRANSPORT_EVENT, (event: UiMessage): void => {
            // post event to reducers
            dispatch({
                type: event.type,
                payload: event.payload
            });
        });

        try {
            await TrezorConnect.init({
                transportReconnect: true,
                connectSrc: 'https://localhost:8088/',
                // connectSrc: 'https://connect.trezor.io/tpm/',
                // connectSrc: 'https://sisyfos.trezor.io/',
                debug: true,
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
export const postInit = (): any => {
    return (dispatch, getState): void => {

        const handleDeviceConnect = (device) => {
            dispatch( initConnectedDevice(device) );
        }

        TrezorConnect.off(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.off(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        TrezorConnect.on(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        const { devices } = getState().connect;

        const { initialPathname, initialParams } = getState().wallet
        if (initialPathname) {
            dispatch({
                type: WALLET.SET_INITIAL_URL,
                pathname: null,
                params: null
            });
        }

        if (devices.length > 0) {
            const unacquired = devices.find(d => d.unacquired);
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

export const initConnectedDevice = (device: any, force): any => {
    return (dispatch, getState): void => {

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
export const onSelectDevice = (device: any): any => {
    return (dispatch, getState): void => {
        // || device.isUsedElsewhere

        console.log("------> REDITTO", device, getState().wallet.initialUrl);

        // switch to initial url and reset this value
        

        if (device.unacquired) {
            dispatch( push(`/device/${ device.path }/acquire`) );
        } else if (device.features.bootloader_mode) {
            dispatch( push(`/device/${ device.path }/bootloader`) );
        } else if (device.instance) {
            dispatch( push(`/device/${ device.features.device_id }:${ device.instance }`) );
        } else {

            const urlParams: any = getState().router.location.params;
            // let url: string = `/device/${ device.features.device_id }/network/ethereum/address/0`;
            let url: string = `/device/${ device.features.device_id }`;
            let instance: ?string;
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
            
            if (urlParams.deviceInstance !== instance || urlParams.device !== device.features.device_id) {
                dispatch( push(url) );
            }
        }
    }
}

export const switchToFirstAvailableDevice = (): any => {
    return async (dispatch, getState): Promise<void> => {

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


export const getSelectedDeviceState = (): any => {
    return async (dispatch, getState): Promise<void> => {
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

export const deviceDisconnect = (device: any): any => {
    return async (dispatch, getState): Promise<void> => {

        const selected = findSelectedDevice(getState().connect);

        if (device && device.features) {
            if (selected && selected.features.device_id === device.features.device_id) {
                dispatch( DiscoveryActions.stop(selected) );
            }

            const affected = getState().connect.devices.filter(d => d.features && d.state && !d.remember && d.features.device_id === device.features.device_id);
            if (affected.length > 0) {
                dispatch({
                    type: CONNECT.REMEMBER_REQUEST,
                    device,
                    instances: affected
                });
            }
        }

        if (!selected) {
            dispatch( switchToFirstAvailableDevice() );
        }

    }
}

export const coinChanged = (network: ?string): any => {
    return (dispatch, getState): void => {
        const selected = findSelectedDevice(getState().connect);
        dispatch( DiscoveryActions.stop(selected) );

        if (network) {
            dispatch( DiscoveryActions.start(selected, network) );
        }
    }
}

export function reload(): any {
    return async (dispatch, getState) => {
    }
}

export function acquire(): any {
    return async (dispatch, getState) => {

        const selected = findSelectedDevice(getState().connect);

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
            })
        } else {
            // TODO: handle invalid pin?
            console.log("-errror ack", response)

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

export const forgetDevice = (device: any) => {
    return (dispatch: any, getState: any): any => {
        
        // find accounts associated with this device
        const accounts: Array<any> = getState().accounts.find(a => a.deviceState === device.state);


        // find discovery processes associated with this device
        const discovery: Array<any> = getState().discovery.find(d => d.deviceState === device.state);

    }
}

export const gotoDeviceSettings = (device: any) => {
    return (dispatch: any, getState: any): any => {
        dispatch( push(`/device/${ device.features.device_id }/settings`) );
    }
}

// called from Aside - device menu (forget single instance)
export const forget = (device: any) => {
    return {
        type: CONNECT.FORGET_REQUEST,
        device
    };
}

export const duplicateDevice = (device: any) => {
    return async (dispatch: any, getState: any): Promise<void> => {
        dispatch({
            type: CONNECT.TRY_TO_DUPLICATE,
            device
        })
    }
}

export const onDuplicateDevice = () => {
    return async (dispatch: any, getState: any): Promise<void> => {
        const selected = findSelectedDevice(getState().connect);
        dispatch(onSelectDevice(selected));
    }
}


export function addAddress(): any {
    return (dispatch, getState) => {
        const selected = findSelectedDevice(getState().connect);
        dispatch( DiscoveryActions.start(selected, getState().router.location.params.network, true) ); // TODO: network nicer
    }
}
