/* @flow */

import TrezorConnect from 'trezor-connect';
import EthereumjsUtil from 'ethereumjs-util';
import * as DISCOVERY from 'actions/constants/discovery';
import * as BlockchainActions from 'actions/ethereum/BlockchainActions';

import type {
    PromiseAction,
    Dispatch,
    GetState,
    TrezorDevice,
    Network,
    Account,
} from 'flowtype';
import type { Discovery } from 'reducers/DiscoveryReducer';

export type DiscoveryStartAction = {
    type: typeof DISCOVERY.START,
    networkType: 'ethereum',
    network: Network,
    device: TrezorDevice,
    publicKey: string,
    chainCode: string,
    basePath: Array<number>,
};

// first iteration
// generate public key for this account
// start discovery process
export const begin = (device: TrezorDevice, network: Network): PromiseAction<DiscoveryStartAction> => async (): Promise<DiscoveryStartAction> => {
    // get xpub from TREZOR
    const response = await TrezorConnect.getPublicKey({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        path: network.bip44,
        keepSession: true, // acquire and hold session
        //useEmptyPassphrase: !device.instance,
        useEmptyPassphrase: device.useEmptyPassphrase,
        network: network.name,
    });

    // handle TREZOR response error
    if (!response.success) {
        throw new Error(response.payload.error);
    }

    const basePath: Array<number> = response.payload.path;

    return {
        type: DISCOVERY.START,
        networkType: 'ethereum',
        network,
        device,
        publicKey: response.payload.publicKey,
        chainCode: response.payload.chainCode,
        basePath,
    };
};

export const discoverAccount = (device: TrezorDevice, discoveryProcess: Discovery): PromiseAction<Account> => async (dispatch: Dispatch, getState: GetState): Promise<Account> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === discoveryProcess.network);
    if (!network) throw new Error('Discovery network not found');

    const derivedKey = discoveryProcess.hdKey.derive(`m/${discoveryProcess.accountIndex}`);
    const path = discoveryProcess.basePath.concat(discoveryProcess.accountIndex);
    const publicAddress: string = EthereumjsUtil.publicToAddress(derivedKey.publicKey, true).toString('hex');
    const ethAddress: string = EthereumjsUtil.toChecksumAddress(publicAddress);

    // TODO: check if address was created before
    const account = await dispatch(BlockchainActions.discoverAccount(device, ethAddress, network.shortcut));

    // const accountIsEmpty = account.transactions <= 0 && account.nonce <= 0 && account.balance === '0';
    const empty = account.nonce <= 0 && account.balance === '0';

    return {
        imported: false,
        index: discoveryProcess.accountIndex,
        network: network.shortcut,
        deviceID: device.features ? device.features.device_id : '0',
        deviceState: device.state || '0',
        accountPath: path,
        descriptor: ethAddress,

        balance: account.balance,
        availableBalance: account.balance,
        block: account.block,
        transactions: account.transactions,
        empty,

        networkType: 'ethereum',
        nonce: account.nonce,
    };
};