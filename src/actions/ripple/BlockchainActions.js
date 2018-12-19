/* @flow */

import TrezorConnect from 'trezor-connect';
import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as PENDING from 'actions/constants/pendingTx';
import * as AccountsActions from 'actions/AccountsActions';
import { toDecimalAmount } from 'utils/formatUtils';

import type { BlockchainNotification } from 'trezor-connect';
import type {
    Dispatch,
    GetState,
    PromiseAction,
} from 'flowtype';

const DECIMALS: number = 6;

export const subscribe = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const accounts: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.address);
    await TrezorConnect.blockchainSubscribe({
        accounts,
        coin: network,
    });
};

export const onBlockMined = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const fee = await TrezorConnect.blockchainGetFee({
        coin: network,
    });
    if (!fee.success) return;

    const blockchain = getState().blockchain.find(b => b.shortcut === network);
    if (!blockchain) return;

    if (fee.payload !== blockchain.fee) {
        dispatch({
            type: BLOCKCHAIN.UPDATE_FEE,
            shortcut: network,
            fee: fee.payload,
        });
    }
};

export const onNotification = (payload: $ElementType<BlockchainNotification, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { notification } = payload;
    const account = getState().accounts.find(a => a.address === notification.address);
    if (!account) return;

    if (notification.status === 'pending') {
        dispatch({
            type: PENDING.ADD,
            payload: {
                ...notification,
                deviceState: account.deviceState,
                network: account.network,

                amount: toDecimalAmount(notification.amount, DECIMALS),
                total: notification.type === 'send' ? toDecimalAmount(notification.total, DECIMALS) : toDecimalAmount(notification.amount, DECIMALS),
                fee: toDecimalAmount(notification.fee, DECIMALS),
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
        coin: account.network,
    });
    if (!updatedAccount.success) return;

    dispatch(AccountsActions.update({
        ...account,
        balance: toDecimalAmount(updatedAccount.payload.balance, DECIMALS),
        availableDevice: toDecimalAmount(updatedAccount.payload.availableBalance, DECIMALS),
        block: updatedAccount.payload.block,
        sequence: updatedAccount.payload.sequence,
    }));
};
