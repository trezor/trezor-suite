/* @flow */

import * as ACCOUNT from 'actions/constants/account';
import * as IMPORT from 'actions/constants/importAccount';
import * as NOTIFICATION from 'actions/constants/notification';
import type { AsyncAction, TrezorDevice, Network, Dispatch, GetState } from 'flowtype';
import * as BlockchainActions from 'actions/ethereum/BlockchainActions';
import * as LocalStorageActions from 'actions/LocalStorageActions';
import TrezorConnect from 'trezor-connect';
import { toDecimalAmount } from 'utils/formatUtils';

export type ImportAccountAction =
    | {
          type: typeof IMPORT.START,
      }
    | {
          type: typeof IMPORT.SUCCESS,
      }
    | {
          type: typeof IMPORT.FAIL,
          error: ?string,
      };

export const importAddress = (
    address: string,
    network: Network,
    device: ?TrezorDevice
): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    if (!device) return;

    dispatch({
        type: IMPORT.START,
    });

    let payload;
    const index = getState().accounts.filter(
        a => a.imported === true && a.network === network.shortcut
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

                networkType: 'ethereum',
                nonce: account.nonce,
            };
            dispatch({
                type: ACCOUNT.CREATE,
                payload,
            });
            dispatch({
                type: IMPORT.SUCCESS,
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
        } else if (network.type === 'ripple') {
            const response = await TrezorConnect.rippleGetAccountInfo({
                account: {
                    descriptor: address,
                },
                coin: network.shortcut,
            });

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

                networkType: 'ripple',
                sequence: account.sequence,
                reserve: toDecimalAmount(account.reserve, network.decimals),
            };
            dispatch({
                type: ACCOUNT.CREATE,
                payload,
            });
            dispatch({
                type: IMPORT.SUCCESS,
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
        }
    } catch (error) {
        dispatch({
            type: IMPORT.FAIL,
            error: error.message,
        });

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
