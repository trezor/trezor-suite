/* @flow */

import TrezorConnect from 'trezor-connect';
import * as DISCOVERY from 'actions/constants/discovery';
import { toDecimalAmount } from 'utils/formatUtils';

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
        coin: network.shortcut,
    });

    // handle TREZOR response error
    if (!response.success) {
        throw new Error(response.payload.error);
    }

    const account = response.payload;
    const empty = account.sequence <= 0 && account.balance === '0';

    return {
        imported: false,
        index: discoveryProcess.accountIndex,
        network: network.shortcut,
        deviceID: device.features ? device.features.device_id : '0',
        deviceState: device.state || '0',
        accountPath: account.path || [],
        descriptor: account.descriptor,

        balance: toDecimalAmount(account.balance, network.decimals),
        availableBalance: toDecimalAmount(account.availableBalance, network.decimals),
        block: account.block,
        transactions: account.transactions,
        empty,

        networkType: 'ripple',
        sequence: account.sequence,
        reserve: toDecimalAmount(account.reserve, network.decimals),
    };
};