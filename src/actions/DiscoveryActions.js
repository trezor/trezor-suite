/* @flow */

import TrezorConnect from 'trezor-connect';
import EthereumjsUtil from 'ethereumjs-util';
import * as DISCOVERY from 'actions/constants/discovery';
import * as ACCOUNT from 'actions/constants/account';
import * as NOTIFICATION from 'actions/constants/notification';

import type {
    ThunkAction,
    AsyncAction,
    PromiseAction,
    PayloadAction,
    GetState,
    Dispatch,
    TrezorDevice,
} from 'flowtype';
import type { Discovery, State } from 'reducers/DiscoveryReducer';
import * as BlockchainActions from './BlockchainActions';

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

export type DiscoveryCompleteAction = {
    type: typeof DISCOVERY.COMPLETE,
    device: TrezorDevice,
    network: string
}

export type DiscoveryAction = {
    type: typeof DISCOVERY.FROM_STORAGE,
    payload: State
} | {
    type: typeof DISCOVERY.STOP,
    device: TrezorDevice
} | DiscoveryStartAction
  | DiscoveryWaitingAction
  | DiscoveryCompleteAction;

// There are multiple async methods during discovery process (trezor-connect and blockchain actions)
// This method will check after each of async action if process was interrupted (for example by network change or device disconnect)
const isProcessInterrupted = (process?: Discovery): PayloadAction<boolean> => (dispatch: Dispatch, getState: GetState): boolean => {
    if (!process) {
        return false;
    }
    const { deviceState, network } = process;
    const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === deviceState && d.network === network);
    if (!discoveryProcess) return false;
    return discoveryProcess.interrupted;
};

// Private action
// Called from "this.begin", "this.restore", "this.addAccount"
const start = (device: TrezorDevice, network: string, ignoreCompleted?: boolean): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
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

    const { discovery } = getState();
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
        dispatch(begin(device, network));
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
        //useEmptyPassphrase: !device.instance,
        useEmptyPassphrase: device.useEmptyPassphrase,
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
    // corner case: DISCOVERY.START wasn't called yet, but Discovery exists in reducer created by DISCOVERY.WAITING_FOR_DEVICE action
    // this is why we need to get process instance directly from reducer
    const discoveryProcess = getState().discovery.find(d => d.deviceState === device.state && d.network === network);
    if (dispatch(isProcessInterrupted(discoveryProcess))) return;

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

const discoverAccount = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    const { completed } = discoveryProcess;

    const derivedKey = discoveryProcess.hdKey.derive(`m/${discoveryProcess.accountIndex}`);
    const path = discoveryProcess.basePath.concat(discoveryProcess.accountIndex);
    const publicAddress: string = EthereumjsUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
    const ethAddress: string = EthereumjsUtil.toChecksumAddress(publicAddress);
    const { network } = discoveryProcess;

    // TODO: check if address was created before
    try {
        const account = await dispatch(BlockchainActions.discoverAccount(device, ethAddress, network));
        // check for interruption
        if (dispatch(isProcessInterrupted(discoveryProcess))) return;

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
                    transactions: account.transactions,
                },
            });
        }

        if (accountIsEmpty) {
            dispatch(finish(device, discoveryProcess));
        } else if (!completed) {
            dispatch(discoverAccount(device, discoveryProcess));
        }
    } catch (error) {
        dispatch({
            type: DISCOVERY.STOP,
            device,
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

const finish = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    await TrezorConnect.getFeatures({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        keepSession: false,
        // useEmptyPassphrase: !device.instance,
        useEmptyPassphrase: device.useEmptyPassphrase,
    });

    await dispatch(BlockchainActions.subscribe(discoveryProcess.network));

    if (dispatch(isProcessInterrupted(discoveryProcess))) return;

    dispatch({
        type: DISCOVERY.COMPLETE,
        device,
        network: discoveryProcess.network,
    });
};

export const reconnect = (network: string): PromiseAction<void> => async (dispatch: Dispatch): Promise<void> => {
    await dispatch(BlockchainActions.subscribe(network));
    dispatch(restore());
};

// Called after DEVICE.CONNECT ('trezor-connect') or CONNECT.AUTH_DEVICE actions in WalletService
// OR after BlockchainSubscribe in this.reconnect
export const restore = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    // check if current url has "network" parameter
    const urlParams = getState().router.location.state;
    if (!urlParams.network) return;

    // make sure that "selectedDevice" exists
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;

    // find discovery process for requested network
    const discoveryProcess: ?Discovery = getState().discovery.find(d => d.deviceState === selected.state && d.network === urlParams.network);

    // if there was no process befor OR process was interrupted/waiting
    const shouldStart = !discoveryProcess || (discoveryProcess.interrupted || discoveryProcess.waitingForDevice || discoveryProcess.waitingForBlockchain);
    if (shouldStart) {
        dispatch(start(selected, urlParams.network));
    }
};

export const stop = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const device: ?TrezorDevice = getState().wallet.selectedDevice;
    if (!device) return;

    // get all uncompleted discovery processes which assigned to selected device
    const discoveryProcesses = getState().discovery.filter(d => d.deviceState === device.state && !d.completed);
    if (discoveryProcesses.length > 0) {
        dispatch({
            type: DISCOVERY.STOP,
            device,
        });
    }
};

export const addAccount = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;
    dispatch(start(selected, getState().router.location.state.network, true));
};
