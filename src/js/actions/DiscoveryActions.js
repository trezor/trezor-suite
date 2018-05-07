/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';
import * as DISCOVERY from './constants/discovery';
import * as ADDRESS from './constants/address';
import * as TOKEN from './constants/token';
import * as NOTIFICATION from './constants/notification';
import * as AddressActions from '../actions/AddressActions';

import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import { getNonceAsync, getBalanceAsync, getTokenBalanceAsync } from './Web3Actions';
import { setBalance as setTokenBalance } from './TokenActions';

import type { ThunkAction, AsyncAction, Action, GetState, Dispatch, TrezorDevice } from '../flowtype';
import type { Discovery, State } from '../reducers/DiscoveryReducer';

export type DiscoveryAction = {
    type: typeof DISCOVERY.FROM_STORAGE,
    payload: State
} | DiscoveryStartAction
  | DiscoveryWaitingAction
  | DiscoveryStopAction
  | DiscoveryCompleteAction;

export type DiscoveryStartAction = {
    type: typeof DISCOVERY.START,
    device: TrezorDevice,
    network: string,
    publicKey: string,
    chainCode: string,
    basePath: Array<number>,
}

export type DiscoveryWaitingAction = {
    type: typeof DISCOVERY.WAITING_FOR_DEVICE | typeof DISCOVERY.WAITING_FOR_BACKEND,
    device: TrezorDevice,
    network: string
}

export type DiscoveryStopAction = {
    type: typeof DISCOVERY.STOP,
    device: TrezorDevice
}

export type DiscoveryCompleteAction = {
    type: typeof DISCOVERY.COMPLETE,
    device: TrezorDevice,
    network: string
}

export const start = (device: TrezorDevice, network: string, ignoreCompleted?: boolean): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

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
        
        const web3 = getState().web3.find(w3 => w3.network === network);
        if (!web3) {
            console.error("Start discovery: Web3 does not exist", network)
            return;
        }

        if (!web3.web3.currentProvider.isConnected()) {
            console.error("Start discovery: Web3 is not connected", network)
            dispatch({
                type: DISCOVERY.WAITING_FOR_BACKEND,
                device,
                network
            });
            return;
        }
        
        const discovery: State = getState().discovery;
        let discoveryProcess: ?Discovery = discovery.find(d => d.deviceState === device.state && d.network === network);

        
        
        if (!selected.connected && (!discoveryProcess || !discoveryProcess.completed)) {
            dispatch({
                type: DISCOVERY.WAITING_FOR_DEVICE,
                device,
                network
            });
            return;
        }

        if (!discoveryProcess) {
            dispatch( begin(device, network) );
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
                dispatch( begin(device, network) );
            } else {
                dispatch( discoverAddress(device, discoveryProcess) );
            }
        }
    }
}

const begin = (device: TrezorDevice, network: string): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const { config } = getState().localStorage;
        const coinToDiscover = config.coins.find(c => c.network === network);
        if (!coinToDiscover) return;

        dispatch({
            type: DISCOVERY.WAITING_FOR_DEVICE,
            device,
            network
        });

        // get xpub from TREZOR
        const response: Object = await TrezorConnect.getPublicKey({ 
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state
            }, 
            path: coinToDiscover.bip44, 
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
                                dispatch(start(device, network))
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

        // send data to reducer
        dispatch({
            type: DISCOVERY.START,
            network: coinToDiscover.network,
            device,
            publicKey: response.payload.publicKey,
            chainCode: response.payload.chainCode,
            basePath,
        });

        dispatch( start(device, network) );
    }
}

const discoverAddress = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        //const hdKey = discoveryProcess.hdKey
        console.log("TYPEOF", typeof discoveryProcess.hdKey.derive, discoveryProcess.hdKey)
        console.log("TYPEOF", typeof discoveryProcess.hdKey.derive === typeof HDKey);
       

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

        // TODO: with block-book (Martin)
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
                        message: `Addresses are different. TREZOR: ${ trezorAddress } HDKey: ${ ethAddress }`,
                        cancelable: true,
                        actions: [
                            {
                                label: 'Try again',
                                callback: () => {
                                    dispatch(start(device, discoveryProcess.network))
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
                                dispatch(start(device, discoveryProcess.network))
                            }
                        }
                    ]
                }
            });
            return;
        }

        const web3instance = getState().web3.find(w3 => w3.network === network);
        if (!web3instance) return;
        
        const balance = await getBalanceAsync(web3instance.web3, ethAddress);
        if (discoveryProcess.interrupted) return;
        dispatch(
            AddressActions.setBalance(ethAddress, network, web3instance.web3.fromWei(balance.toString(), 'ether'))
        );

        const userTokens = [];
        // const userTokens = [
        //     { symbol: 'T01', address: '0x58cda554935e4a1f2acbe15f8757400af275e084' },
        //     { symbol: 'Lahod', address: '0x3360d0ee34a49d9ac34dce88b000a2903f2806ee' },
        // ];

        for (let i = 0; i < userTokens.length; i++) {
            const tokenBalance = await getTokenBalanceAsync(web3instance.erc20, userTokens[i].address, ethAddress);
            if (discoveryProcess.interrupted) return;
            dispatch( setTokenBalance(userTokens[i].address, ethAddress, tokenBalance.toString()) )
        }

        const nonce: number = await getNonceAsync(web3instance.web3, ethAddress);
        if (discoveryProcess.interrupted) return;
        dispatch({
            type: ADDRESS.SET_NONCE,
            address: ethAddress,
            network,
            nonce: nonce
        });

        const addressIsEmpty = nonce < 1 && !balance.greaterThan(0);

        if (!addressIsEmpty) {
            dispatch( discoverAddress(device, discoveryProcess) );
        } else {
            // release acquired sesssion
            await TrezorConnect.getFeatures({ 
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state
                },
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

export const restore = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const selected = findSelectedDevice(getState().connect);

        if (selected && selected.connected && !selected.unacquired) {
            const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.waitingForDevice);
            if (discoveryProcess) {
                dispatch( start(selected, discoveryProcess.network) );
            }
        }
    }
}


// there is no discovery process but it should be
// this is possible race condition when "network" was changed in url but device was not authenticated yet
// try to start discovery after CONNECT.AUTH_DEVICE action
export const check = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const selected = findSelectedDevice(getState().connect);
        if (!selected) return;

        const urlParams = getState().router.location.state;
        if (urlParams.network) {
            const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.network === urlParams.network);
            if (!discoveryProcess) {
                dispatch( start(selected, urlParams.network) );
            }
        }
    }
}

export const stop = (device: TrezorDevice): Action => {
    // TODO: release devices session
    // corner case switch /eth to /etc (discovery start stop - should not be async)
    return {
        type: DISCOVERY.STOP,
        device
    }
}