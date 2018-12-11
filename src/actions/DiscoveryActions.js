/* @flow */

import TrezorConnect, { UI } from 'trezor-connect';
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
    Account,
} from 'flowtype';
import type { Discovery, State } from 'reducers/DiscoveryReducer';
import * as BlockchainActions from './BlockchainActions';
import * as EthereumDiscoveryActions from './ethereum/DiscoveryActions';
import * as RippleDiscoveryActions from './ripple/DiscoveryActions';

export type DiscoveryStartAction = EthereumDiscoveryActions.DiscoveryStartAction | RippleDiscoveryActions.DiscoveryStartAction;

export type DiscoveryWaitingAction = {
    type: typeof DISCOVERY.WAITING_FOR_DEVICE | typeof DISCOVERY.WAITING_FOR_BLOCKCHAIN | typeof DISCOVERY.FIRMWARE_NOT_SUPPORTED | typeof DISCOVERY.FIRMWARE_OUTDATED,
    device: TrezorDevice,
    network: string,
}

export type DiscoveryCompleteAction = {
    type: typeof DISCOVERY.COMPLETE,
    device: TrezorDevice,
    network: string,
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

    const blockchain = getState().blockchain.find(b => b.shortcut === network);
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
const begin = (device: TrezorDevice, networkName: string): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === networkName);
    if (!network) return;

    dispatch({
        type: DISCOVERY.WAITING_FOR_DEVICE,
        device,
        network: networkName,
    });

    let startAction: DiscoveryStartAction;

    try {
        switch (network.type) {
            case 'ethereum':
                startAction = await dispatch(EthereumDiscoveryActions.begin(device, network));
                break;
            case 'ripple':
                startAction = await dispatch(RippleDiscoveryActions.begin(device, network));
                break;
            default:
                throw new Error(`DiscoveryActions.begin: Unknown network type: ${network.type}`);
        }
    } catch (error) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Discovery error',
                message: error.message,
                cancelable: true,
                actions: [
                    {
                        label: 'Try again',
                        callback: () => {
                            dispatch(start(device, networkName));
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

    // send data to reducer
    dispatch(startAction);

    // next iteration
    dispatch(start(device, networkName));
};

const discoverAccount = (device: TrezorDevice, discoveryProcess: Discovery): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === discoveryProcess.network);
    if (!network) return;

    const { completed, accountIndex } = discoveryProcess;
    let account: Account;
    try {
        switch (network.type) {
            case 'ethereum':
                account = await dispatch(EthereumDiscoveryActions.discoverAccount(device, discoveryProcess));
                break;
            case 'ripple':
                account = await dispatch(RippleDiscoveryActions.discoverAccount(device, discoveryProcess));
                break;
            default:
                throw new Error(`DiscoveryActions.discoverAccount: Unknown network type: ${network.type}`);
        }
    } catch (error) {
        // handle not supported firmware error
        if (error.message === UI.FIRMWARE_NOT_SUPPORTED) {
            dispatch({
                type: DISCOVERY.FIRMWARE_NOT_SUPPORTED,
                device,
                network: discoveryProcess.network,
            });
            return;
        }

        // handle outdated firmware error
        if (error.message === UI.FIRMWARE) {
            dispatch({
                type: DISCOVERY.FIRMWARE_OUTDATED,
                device,
                network: discoveryProcess.network,
            });
            return;
        }

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
        return;
    }

    if (dispatch(isProcessInterrupted(discoveryProcess))) return;

    const accountIsEmpty = account.empty;
    if (!accountIsEmpty || (accountIsEmpty && completed) || (accountIsEmpty && accountIndex === 0)) {
        dispatch({
            type: ACCOUNT.CREATE,
            payload: account,
        });
    }

    if (accountIsEmpty) {
        dispatch(finish(device, discoveryProcess));
    } else if (!completed) {
        dispatch(discoverAccount(device, discoveryProcess));
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
