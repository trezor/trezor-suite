/* @flow */
'use strict';

import TrezorConnect, { UI, DEVICE, DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT } from 'trezor-connect';
import * as ADDRESS from './constants/Address';
import * as TOKEN from './constants/Token';
import * as CONNECT from './constants/TrezorConnect';
import * as DISCOVERY from './constants/Discovery';
import * as NOTIFICATION from './constants/notification';
import * as WALLET from './constants/wallet';

import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import EthereumjsTx from 'ethereumjs-tx';

import { getBalance } from './Web3Actions';

import { push } from 'react-router-redux';

import { init as initWeb3, getNonceAsync, getBalanceAsync, getTokenBalanceAsync } from './Web3Actions';

import type { Discovery } from '../reducers/DiscoveryReducer';
import { resolveAfter } from '../utils/promiseUtils';
import { getAccounts } from '../utils/reducerUtils';
import { findSelectedDevice, isSavedDevice, TrezorDevice } from '../reducers/TrezorConnectReducer';

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

            // wait for init

            // setTimeout(() => {
            //   dispatch( initWeb3() );
            //}, 2000)

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
    
        // const handleDeviceDisconnect = (device) => {
        //     // remove addresses and discovery from state
        //     // dispatch( remove(device) );
        // }

        TrezorConnect.off(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.off(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        TrezorConnect.on(DEVICE.CONNECT, handleDeviceConnect);
        TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceConnect);

        // TrezorConnect.on(DEVICE.DISCONNECT, handleDeviceDisconnect);
        // TrezorConnect.on(DEVICE.CONNECT_UNACQUIRED, handleDeviceDisconnect);

        // possible race condition: 
        // devices were connected before Web3 initialized. force DEVICE.CONNECT event on them
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
                stopDiscoveryProcess(selected);
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
        dispatch( stopDiscoveryProcess(selected) );

        if (network) {
            dispatch( startDiscoveryProcess(selected, network) );
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

export const beginDiscoveryProcess = (device: any, network: string): any => {
    return async (dispatch, getState) => {

        const { config } = getState().localStorage;
        const coinToDiscover = config.coins.find(c => c.network === network);

        dispatch({
            type: DISCOVERY.WAITING,
            device,
            network
        });

        // TODO: validate device deviceState
        // const deviceState = await __acquire(device.path, device.instance);
        // if (deviceState && deviceState.success) {
        //     if (deviceState.payload.xpub !== device.state) {
        //         console.error("Incorrect deviceState!");
        //         return;
        //     }
        // }

        // get xpub from TREZOR
        const response = await TrezorConnect.getPublicKey({ 
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state
            }, 
            path: coinToDiscover.bip44, 
            confirmation: false,
            keepSession: true // acquire and hold session
        });

        // handle TREZOR response error
        if (!response.success) {
            // TODO: check message
            console.warn("DISCOVERY ERROR", response)
            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Discovery error',
                    message: response.payload.error,
                    cancelable: true,
                    actions: [
                        {
                            label: 'Try again',
                            callback: () => {
                                dispatch(startDiscoveryProcess(device, network))
                            }
                        }
                    ]
                }
            })
            return;
        }

        // check for interruption
        let discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === device.state && d.network === network);
        if (discoveryProcess && discoveryProcess.interrupted) return;
        
        const basePath: Array<number> = response.payload.path;
        const hdKey = new HDKey();
        hdKey.publicKey = new Buffer(response.payload.publicKey, 'hex');
        hdKey.chainCode = new Buffer(response.payload.chainCode, 'hex');

        // send data to reducer
        dispatch({
            type: DISCOVERY.START,
            network: coinToDiscover.network,
            device,
            xpub: response.payload.publicKey,
            basePath,
            hdKey,
        });

        dispatch( startDiscoveryProcess(device, network) );
    }
}

export const discoverAddress = (device: any, discoveryProcess: Discovery): any => {
    return async (dispatch, getState) => {

        const derivedKey = discoveryProcess.hdKey.derive(`m/${discoveryProcess.accountIndex}`);
        const path = discoveryProcess.basePath.concat(discoveryProcess.accountIndex);
        const publicAddress: string = EthereumjsUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
        const ethAddress: string = EthereumjsUtil.toChecksumAddress(publicAddress);
        const network = discoveryProcess.network;

        dispatch({
            type: ADDRESS.CREATE,
            device,
            network,
            index: discoveryProcess.accountIndex,
            path,
            address: ethAddress 
        });

        // TODO: check if address was created before

        // verify address with TREZOR
        const verifyAddress = await TrezorConnect.ethereumGetAddress({ 
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state
            },
            path,
            showOnTrezor: false
        });
        if (discoveryProcess.interrupted) return;

        // const discoveryA = await TrezorConnect.accountDiscovery({
        //     device: {
        //         path: device.path,
        //         instance: device.instance,
        //         state: device.state
        //     },
        // });
        // if (discoveryProcess.interrupted) return;

        if (verifyAddress && verifyAddress.success) {
            //const trezorAddress: string = '0x' + verifyAddress.payload.address;
            const trezorAddress: string = EthereumjsUtil.toChecksumAddress(verifyAddress.payload.address);
            if (trezorAddress !== ethAddress) {
                // throw inconsistent state error
                console.warn("Inconsistent state", trezorAddress, ethAddress);

                dispatch({
                    type: NOTIFICATION.ADD,
                    payload: {
                        type: 'error',
                        title: 'Address validation error',
                        message: `Addresses are different. ${ trezorAddress } : ${ ethAddress }`,
                        cancelable: true,
                        actions: [
                            {
                                label: 'Try again',
                                callback: () => {
                                    dispatch(startDiscoveryProcess(device, discoveryProcess.network))
                                }
                            }
                        ]
                    }
                });
                return;
            }
        } else {
            // handle TREZOR communication error
            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Address validation error',
                    message: verifyAddress.payload.error,
                    cancelable: true,
                    actions: [
                        {
                            label: 'Try again',
                            callback: () => {
                                dispatch(startDiscoveryProcess(device, discoveryProcess.network))
                            }
                        }
                    ]
                }
            });
            return;
        }

        const web3instance = getState().web3.find(w3 => w3.network === network);
        
        const balance = await getBalanceAsync(web3instance.web3, ethAddress);
        if (discoveryProcess.interrupted) return;
        dispatch({
            type: ADDRESS.SET_BALANCE,
            address: ethAddress,
            network,
            balance: web3instance.web3.fromWei(balance.toString(), 'ether')
        });

        const userTokens = [];
        // const userTokens = [
        //     { symbol: 'T01', address: '0x58cda554935e4a1f2acbe15f8757400af275e084' },
        //     { symbol: 'Lahod', address: '0x3360d0ee34a49d9ac34dce88b000a2903f2806ee' },
        // ];

        for (let i = 0; i < userTokens.length; i++) {
            const tokenBalance = await getTokenBalanceAsync(web3instance.erc20, userTokens[i].address, ethAddress);
            if (discoveryProcess.interrupted) return;
            dispatch({
                type: TOKEN.SET_BALANCE,
                tokenName: userTokens[i].symbol,
                ethAddress: ethAddress,
                tokenAddress: userTokens[i].address,
                balance: tokenBalance.toString()
            })
        }

        const nonce = await getNonceAsync(web3instance.web3, ethAddress);
        if (discoveryProcess.interrupted) return;
        dispatch({
            type: ADDRESS.SET_NONCE,
            address: ethAddress,
            network,
            nonce: nonce
        });

        const addressIsEmpty = nonce < 1 && !balance.greaterThan(0);

        if (!addressIsEmpty) {
            //dispatch( startDiscoveryProcess(device, discoveryProcess.network) );
            dispatch( discoverAddress(device, discoveryProcess) );
        } else {
            // release acquired sesssion
            await TrezorConnect.getPublicKey({ 
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state
                }, 
                path: "m/44'/60'/0'/0",
                confirmation: false,
                keepSession: false
            });
            if (discoveryProcess.interrupted) return;

            dispatch({
                type: DISCOVERY.COMPLETE,
                device,
                network
            });
        }
    }
}

export function startDiscoveryProcess(device: any, network: string, ignoreCompleted?: boolean): any {
    return (dispatch, getState) => {

        const selected = findSelectedDevice(getState().connect);
        if (!selected) {
            // TODO: throw error
            console.error("Start discovery: no selected device", device)
            return;
        } else if (selected.path !== device.path) {
            console.error("Start discovery: requested device is not selected", device, selected)
            return;
        } else if (!selected.state) {
            console.warn("Start discovery: Selected device wasn't authenticated yet...")
            return;
        } else if (selected.connected && !selected.available) {
            console.warn("Start discovery: Selected device is unavailable...")
            return;
        }

        const discovery = getState().discovery;
        let discoveryProcess: ?Discovery = discovery.find(d => d.deviceState === device.state && d.network === network);

        if (!selected.connected && (!discoveryProcess || !discoveryProcess.completed)) {
            dispatch({
                type: DISCOVERY.WAITING,
                device,
                network
            });
            return;
        }

        if (!discoveryProcess) {
            dispatch( beginDiscoveryProcess(device, network) );
            return;
        } else {
            if (discoveryProcess.completed && !ignoreCompleted) {
                dispatch({
                    type: DISCOVERY.COMPLETE,
                    device,
                    network
                });
            } else if (discoveryProcess.interrupted || discoveryProcess.waitingForDevice) {
                // discovery cycle was interrupted
                // start from beginning 
                dispatch( beginDiscoveryProcess(device, network) );
            } else {
                dispatch( discoverAddress(device, discoveryProcess) );
            }
        }
    }
}

export const restoreDiscovery = (): any => {
    return (dispatch, getState): void => {
        const selected = findSelectedDevice(getState().connect);

        if (selected && selected.connected && !selected.unacquired) {
            const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.waitingForDevice);
            if (discoveryProcess) {
                dispatch( startDiscoveryProcess(selected, discoveryProcess.network) );
            }
        }
    }
}

// there is no discovery process but it should be
// this is possible race condition when "network" was changed in url but device was not authenticated yet
// try to start discovery after CONNECT.AUTH_DEVICE action
export const checkDiscoveryStatus = (): any => {
    return (dispatch, getState): void => {
        const selected = findSelectedDevice(getState().connect);
        if (!selected) return;

        const urlParams = getState().router.location.params;
        if (urlParams.network) {
            const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.network === urlParams.network);
            if (!discoveryProcess) {
                dispatch( startDiscoveryProcess(selected, urlParams.network) );
            }
        }
    }
}



export function stopDiscoveryProcess(device: any): any {

    // TODO: release devices session
    // corner case swtich /eth to /etc (discovery start stop - should not be async)
    return {
        type: DISCOVERY.STOP,
        device
    }
}

export function addAddress(): any {
    return (dispatch, getState) => {
        const selected = findSelectedDevice(getState().connect);
        dispatch( startDiscoveryProcess(selected, getState().router.location.params.network, true) ); // TODO: network nicer
    }
}
