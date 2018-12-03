/* @flow */

import TrezorConnect from 'trezor-connect';
import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as PENDING from 'actions/constants/pendingTx';
import * as AccountsActions from 'actions/AccountsActions';

import type { BlockchainNotification } from 'trezor-connect';
import type {
    Dispatch,
    GetState,
    PromiseAction,
} from 'flowtype';


export const subscribe = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const accounts: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.address);
    await TrezorConnect.blockchainSubscribe({
        accounts,
        coin: network,
    });
};


export const onBlockMined = (network: string): PromiseAction<void> => async (dispatch: Dispatch): Promise<void> => {
    const fee = await TrezorConnect.blockchainGetFee({
        coin: network,
    });
    if (!fee.success) return;

    dispatch({
        type: BLOCKCHAIN.UPDATE_FEE,
        fee: fee.payload,
    });
};

export const onNotification = (payload: $ElementType<BlockchainNotification, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { notification } = payload;
    const account = getState().accounts.find(a => a.address === notification.address);
    if (!account) return;

    if (notification.status === 'pending') {
        dispatch({
            type: PENDING.ADD,
            payload: {
                type: notification.type,
                hash: notification.hash,
                network: account.network,
                address: account.address,
                currency: account.network,
                amount: notification.amount,
                total: notification.amount,
                fee: notification.fee,
            },
        });

        // todo: replace "send success" notification with link to explorer
    } else if (notification.status === 'confirmed') {
        dispatch({
            type: PENDING.TX_RESOLVED,
            hash: notification.hash,
        });
    }

    const updatedAccount = await TrezorConnect.rippleGetAccountInfo({
        account: {
            address: account.address,
            block: account.block,
            history: false,
        },
    });
    if (!updatedAccount.success) return;

    dispatch(AccountsActions.update({
        ...account,
        balance: updatedAccount.payload.balance,
        block: updatedAccount.payload.block,
        sequence: updatedAccount.payload.sequence,
    }));
};
