/* @flow */

import TrezorConnect from 'trezor-connect';
import HDKey from 'hdkey';
import EthereumjsUtil from 'ethereumjs-util';
import * as DISCOVERY from './constants/discovery';
import * as ACCOUNT from './constants/account';
import * as TOKEN from './constants/token';
import * as NOTIFICATION from './constants/notification';
import * as AccountsActions from './AccountsActions';

import { getNonceAsync, getBalanceAsync, getTokenBalanceAsync } from './Web3Actions';
import { setBalance as setTokenBalance } from './TokenActions';

import type {
    ThunkAction, AsyncAction, Action, GetState, Dispatch, TrezorDevice,
} from '~/flowtype';

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

export const start = (device: TrezorDevice, network: string, ignoreCompleted?: boolean): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) {
        // TODO: throw error
        console.error('Start discovery: no selected device', device);
        return;
    } if (selected.path !== device.path) {
        console.error('Start discovery: requested device is not selected', device, selected);
        return;
    } if (!selected.state) {
        console.warn("Start discovery: Selected device wasn't authenticated yet...");
        return;
    } if (selected.connected && !selected.available) {
        console.warn('Start discovery: Selected device is unavailable...');
        return;
    }

    const web3 = getState().web3.find(w3 => w3.network === network);
    if (!web3) {
        console.error('Start discovery: Web3 does not exist', network);
        return;
    }

    if (!web3.web3.currentProvider.isConnected()) {
        console.error('Start discovery: Web3 is not connected', network);
        dispatch({
            type: DISCOVERY.WAITING_FOR_BACKEND,
            device,
            network,
        });
        return;
    }

    const discovery: State = getState().discovery;
    const discoveryProcess: ?Discovery = discovery.find(d => d.deviceState === device.state && d.network === network);


    if (!selected.connected && (!discoveryProcess || !discoveryProcess.completed)) {
        dispatch({
            type: DISCOVERY.WAITING_FOR_DEVICE,
            device,
            network,
        });
        return;
    }

    if (!discoveryProcess) {
        dispatch(begin(device, network));
    } else if (discoveryProcess.completed && !ignoreCompleted) {
        dispatch({
            type: DISCOVERY.COMPLETE,
            device,
            network,
        });
    } else if (discoveryProcess.interrupted || discoveryProcess.waitingForDevice) {
        // discovery cycle was interrupted
        // start from beginning
        dispatch(begin(device, network));
    } else {
        dispatch(discoverAccount(device, discoveryProcess));
    }
};

const begin = (device: TrezorDevice, network: string): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { config } = getState().localStorage;
    const coinToDiscover = config.coins.find(c => c.network === network);
    if (!coinToDiscover) return;

    dispatch({
        type: DISCOVERY.WAITING_FOR_DEVICE,
        device,
        network,
    });

    // get xpub from TREZOR
    const response = await TrezorConnect.getPublicKey({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        path: coinToDiscover.bip44,
        keepSession: true, // acquire and hold session
        useEmptyPassphrase: !device.instance,
    });

        // handle TREZOR response error
    if (!response.success) {
        // TODO: check message
        console.warn('DISCOVERY ERROR', response);
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
                            dispatch(start(device, network));
                        },
                    },
                ],
            },
        });
        return;
    }

    // check for interruption
    const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === device.state && d.network === network);
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

    dispatch(start(device, network));
};

const discoverAccount = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const completed: boolean = discoveryProcess.completed;
    discoveryProcess.completed = false;

    const derivedKey = discoveryProcess.hdKey.derive(`m/${discoveryProcess.accountIndex}`);
    const path = discoveryProcess.basePath.concat(discoveryProcess.accountIndex);
    const publicAddress: string = EthereumjsUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
    const ethAddress: string = EthereumjsUtil.toChecksumAddress(publicAddress);
    const network = discoveryProcess.network;


    // TODO: check if address was created before

    // verify address with TREZOR
    const verifyAddress = await TrezorConnect.ethereumGetAddress({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        path,
        showOnTrezor: false,
        keepSession: true,
        useEmptyPassphrase: !device.instance,
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
            console.warn('Inconsistent state', trezorAddress, ethAddress);

            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Address validation error',
                    message: `Addresses are different. TREZOR: ${trezorAddress} HDKey: ${ethAddress}`,
                    cancelable: true,
                    actions: [
                        {
                            label: 'Try again',
                            callback: () => {
                                dispatch(start(device, discoveryProcess.network));
                            },
                        },
                    ],
                },
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
                            dispatch(start(device, discoveryProcess.network));
                        },
                    },
                ],
            },
        });
        return;
    }

    const web3instance = getState().web3.find(w3 => w3.network === network);
    if (!web3instance) return;

    const balance = await getBalanceAsync(web3instance.web3, ethAddress);
    if (discoveryProcess.interrupted) return;
    const nonce: number = await getNonceAsync(web3instance.web3, ethAddress);
    if (discoveryProcess.interrupted) return;

    const addressIsEmpty = nonce < 1 && !balance.greaterThan(0);

    if (!addressIsEmpty || (addressIsEmpty && completed) || (addressIsEmpty && discoveryProcess.accountIndex === 0)) {
        dispatch({
            type: ACCOUNT.CREATE,
            device,
            network,
            index: discoveryProcess.accountIndex,
            path,
            address: ethAddress,
        });
        dispatch(
            AccountsActions.setBalance(ethAddress, network, device.state || 'undefined', web3instance.web3.fromWei(balance.toString(), 'ether')),
        );
        dispatch(AccountsActions.setNonce(ethAddress, network, device.state || 'undefined', nonce));

        if (!completed) { dispatch(discoverAccount(device, discoveryProcess)); }
    }

    if (addressIsEmpty) {
        // release acquired sesssion
        await TrezorConnect.getFeatures({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            keepSession: false,
            useEmptyPassphrase: !device.instance,
        });
        if (discoveryProcess.interrupted) return;

        dispatch({
            type: DISCOVERY.COMPLETE,
            device,
            network,
        });
    }
};

export const restore = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const selected = getState().wallet.selectedDevice;

    if (selected && selected.connected && selected.features) {
        const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.waitingForDevice);
        if (discoveryProcess) {
            dispatch(start(selected, discoveryProcess.network));
        }
    }
};

// TODO: rename method to something intuitive
// there is no discovery process but it should be
// this is possible race condition when "network" was changed in url but device was not authenticated yet
// try to start discovery after CONNECT.AUTH_DEVICE action
export const check = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;

    const urlParams = getState().router.location.state;
    if (urlParams.network) {
        const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.network === urlParams.network);
        if (!discoveryProcess) {
            dispatch(start(selected, urlParams.network));
        }
    }
};

export const stop = (device: TrezorDevice): Action => ({
    type: DISCOVERY.STOP,
    device,
});
