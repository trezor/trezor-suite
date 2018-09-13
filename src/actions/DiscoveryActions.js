/* @flow */

import TrezorConnect from 'trezor-connect';
import EthereumjsUtil from 'ethereumjs-util';
import * as DISCOVERY from 'actions/constants/discovery';
import * as ACCOUNT from 'actions/constants/account';
import * as NOTIFICATION from 'actions/constants/notification';
import type {
    ThunkAction, AsyncAction, PromiseAction, Action, GetState, Dispatch, TrezorDevice,
} from 'flowtype';
import type { Discovery, State } from 'reducers/DiscoveryReducer';
import * as AccountsActions from './AccountsActions';
import * as Web3Actions from './Web3Actions';

import * as BlockchainActions from './BlockchainActions';
import { setBalance as setTokenBalance } from './TokenActions';


export type DiscoveryStartAction = {
    type: typeof DISCOVERY.START,
    device: TrezorDevice,
    network: string,
    publicKey: string,
    chainCode: string,
    basePath: Array<number>,
}

export type DiscoveryWaitingAction = {
    type: typeof DISCOVERY.WAITING_FOR_DEVICE | typeof DISCOVERY.WAITING_FOR_BLOCKCHAIN,
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

export type DiscoveryAction = {
    type: typeof DISCOVERY.FROM_STORAGE,
    payload: State
} | DiscoveryStartAction
  | DiscoveryWaitingAction
  | DiscoveryStopAction
  | DiscoveryCompleteAction;

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

    const blockchain = getState().blockchain.find(b => b.name === network);
    if (blockchain && !blockchain.connected && (!discoveryProcess || !discoveryProcess.completed)) {
        dispatch({
            type: DISCOVERY.WAITING_FOR_BLOCKCHAIN,
            device,
            network,
        });
        return;
    }

    if (!discoveryProcess) {
        dispatch(begin(device, network))
    } else if (discoveryProcess.completed && !ignoreCompleted) {
        dispatch({
            type: DISCOVERY.COMPLETE,
            device,
            network,
        });
    } else if (discoveryProcess.interrupted || discoveryProcess.waitingForDevice || discoveryProcess.waitingForBlockchain) {
        // discovery cycle was interrupted
        // start from beginning
        dispatch(begin(device, network));
    } else {
        dispatch(discoverAccount(device, discoveryProcess));
    }
};

// first iteration
// generate public key for this account
// start discovery process
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

    // next iteration
    dispatch(start(device, network));
};

const discoverAccount = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { completed } = discoveryProcess;
    discoveryProcess.completed = false;

    const derivedKey = discoveryProcess.hdKey.derive(`m/${discoveryProcess.accountIndex}`);
    const path = discoveryProcess.basePath.concat(discoveryProcess.accountIndex);
    const publicAddress: string = EthereumjsUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
    const ethAddress: string = EthereumjsUtil.toChecksumAddress(publicAddress);
    const { network } = discoveryProcess;

    // TODO: check if address was created before

    try {
        const account = await dispatch( BlockchainActions.discoverAccount(device, ethAddress, network) );
        if (discoveryProcess.interrupted) return;

        // const accountIsEmpty = account.transactions <= 0 && account.nonce <= 0 && account.balance === '0';
        const accountIsEmpty = account.nonce <= 0 && account.balance === '0';
        if (!accountIsEmpty || (accountIsEmpty && completed) || (accountIsEmpty && discoveryProcess.accountIndex === 0)) {

            dispatch({
                type: ACCOUNT.CREATE,
                payload: {
                    index: discoveryProcess.accountIndex,
                    loaded: true,
                    network,
                    deviceID: device.features ? device.features.device_id : '0',
                    deviceState: device.state || '0',
                    addressPath: path,
                    address: ethAddress,
                    balance: account.balance,
                    nonce: account.nonce,
                    block: account.block,
                    transactions: account.transactions
                }
            });
        }

        if (accountIsEmpty) {
            dispatch( finish(device, discoveryProcess) );
        } else {
            if (!completed) { dispatch( discoverAccount(device, discoveryProcess) ); }
        }

    } catch (error) {

        dispatch({
            type: DISCOVERY.STOP,
            device
        });

        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Account discovery error',
                message: error.message,
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
    }
};

const finish = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {

    console.warn("FINISH!");
    await TrezorConnect.getFeatures({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        keepSession: false,
        useEmptyPassphrase: !device.instance,
    });

    await dispatch( BlockchainActions.subscribe(discoveryProcess.network) );

    if (discoveryProcess.interrupted) return;

    dispatch({
        type: DISCOVERY.COMPLETE,
        device,
        network: discoveryProcess.network,
    });

}

export const reconnect = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    await dispatch(BlockchainActions.subscribe(network));
    dispatch(restore());
}

export const restore = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const selected = getState().wallet.selectedDevice;

    if (selected && selected.connected && selected.features) {
        const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && (d.interrupted || d.waitingForDevice || d.waitingForBlockchain));
        console.warn("AAAA2")
        if (discoveryProcess) {
            console.warn("AAAA3", discoveryProcess)
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
