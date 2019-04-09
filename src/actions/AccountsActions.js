/* @flow */

import * as ACCOUNT from 'actions/constants/account';
import * as NOTIFICATION from 'actions/constants/notification';
import type { Action, TrezorDevice, Network } from 'flowtype';
import type { Account, State } from 'reducers/AccountsReducer';
import * as BlockchainActions from 'actions/ethereum/BlockchainActions';
import * as LocalStorageActions from 'actions/LocalStorageActions';
import TrezorConnect from 'trezor-connect';
import { toDecimalAmount } from 'utils/formatUtils';

export type AccountAction =
    | {
          type: typeof ACCOUNT.FROM_STORAGE,
          payload: State,
      }
    | {
          type: typeof ACCOUNT.CREATE | typeof ACCOUNT.UPDATE,
          payload: Account,
      };

export const update = (account: Account): Action => ({
    type: ACCOUNT.UPDATE,
    payload: account,
});

export const importAddress = (
    address: string,
    network: Network,
    device: TrezorDevice
): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    if (!device) return;

    let payload;
    const index = getState().accounts.filter(
        a => a.imported === true && a.network === network.shortcut && a.deviceState === device.state
    ).length;

    try {
        if (network.type === 'ethereum') {
            const account = await dispatch(
                BlockchainActions.discoverAccount(device, address, network.shortcut)
            );

            const empty = account.nonce <= 0 && account.balance === '0';
            payload = {
                imported: true,
                index,
                network: network.shortcut,
                deviceID: device.features ? device.features.device_id : '0',
                deviceState: device.state || '0',
                accountPath: account.path || [],
                descriptor: account.descriptor,

                balance: account.balance,
                availableBalance: account.balance,
                block: account.block,
                transactions: account.transactions,
                empty,

                networkType: network.type,
                nonce: account.nonce,
            };
        } else if (network.type === 'ripple') {
            const response = await TrezorConnect.rippleGetAccountInfo({
                account: {
                    descriptor: address,
                },
                coin: network.shortcut,
            });
            console.log(response);

            // handle TREZOR response error
            if (!response.success) {
                throw new Error(response.payload.error);
            }

            const account = response.payload;
            const empty = account.sequence <= 0 && account.balance === '0';

            payload = {
                imported: true,
                index,
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

                networkType: network.type,
                sequence: account.sequence,
                reserve: toDecimalAmount(account.reserve, network.decimals),
            };
        }
        dispatch({
            type: ACCOUNT.CREATE,
            payload,
        });
        dispatch(LocalStorageActions.setImportedAccount(payload));
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'success',
                title: 'The account has been successfully imported',
                cancelable: true,
            },
        });
    } catch (error) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Import account error',
                message: error.message,
                cancelable: true,
            },
        });
    }
};
