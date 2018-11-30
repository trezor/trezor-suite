/* @flow */

import TrezorConnect from 'trezor-connect';
import * as DISCOVERY from 'actions/constants/discovery';

import type {
    PromiseAction,
    GetState,
    Dispatch,
    TrezorDevice,
    Network,
    Account,
} from 'flowtype';
import type { Discovery } from 'reducers/DiscoveryReducer';

export type DiscoveryStartAction = {
    type: typeof DISCOVERY.START,
    networkType: 'ripple',
    network: Network,
    device: TrezorDevice,
};

export const begin = (device: TrezorDevice, network: Network): PromiseAction<DiscoveryStartAction> => async (): Promise<DiscoveryStartAction> => ({
    type: DISCOVERY.START,
    networkType: 'ripple',
    network,
    device,
});

export const discoverAccount = (device: TrezorDevice, discoveryProcess: Discovery): PromiseAction<Account> => async (dispatch: Dispatch, getState: GetState): Promise<Account> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === discoveryProcess.network);
    if (!network) throw new Error('Discovery network not found');

    const { accountIndex } = discoveryProcess;
    const path = network.bip44.slice(0).replace('a', accountIndex.toString());

    // $FlowIssue npm not released yet
    const response = await TrezorConnect.rippleGetAccountInfo({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        account: {
            path,
            block: 0,
        },
        keepSession: true, // acquire and hold session
        useEmptyPassphrase: device.useEmptyPassphrase,
    });

    // handle TREZOR response error
    if (!response.success) {
        throw new Error(response.payload.error);
    }

    const account = response.payload;
    const empty = account.sequence <= 0 && account.balance === '0';

    return {
        index: discoveryProcess.accountIndex,
        loaded: true,
        network: network.shortcut,
        deviceID: device.features ? device.features.device_id : '0',
        deviceState: device.state || '0',
        addressPath: account.path,
        address: account.address,
        balance: account.balance,
        nonce: account.sequence,
        block: account.block,
        transactions: account.transactions,
        empty,
    };
};