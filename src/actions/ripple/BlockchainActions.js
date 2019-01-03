/* @flow */

import TrezorConnect from 'trezor-connect';
// import * as BLOCKCHAIN from 'actions/constants/blockchain';
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
    const accounts: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.descriptor);
    await TrezorConnect.blockchainSubscribe({
        accounts,
        coin: network,
    });
};

export const onBlockMined = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const blockchain = getState().blockchain.find(b => b.shortcut === network);
    if (!blockchain) return;

    // const fee = await TrezorConnect.blockchainGetFee({
    //     coin: network,
    // });
    // if (!fee.success) return;

    // if (fee.payload !== blockchain.fee) {
    //     dispatch({
    //         type: BLOCKCHAIN.UPDATE_FEE,
    //         shortcut: network,
    //         fee: fee.payload,
    //     });
    // }

    const accounts: Array<any> = getState().accounts.filter(a => a.network === network);
    // console.warn('ACCOUNTS', accounts);
    if (accounts.length > 0) {
        // const response = await TrezorConnect.rippleGetAccountInfo({
        //     bundle: accounts,
        //     level: 'transactions',
        //     coin: network,
        // });

        // if (!response.success) return;

        // response.payload.forEach((a, i) => {
        //     if (a.transactions.length > 0) {
        //         console.warn('APDEJTED!', a, i);
        //         dispatch(AccountsActions.update({
        //             ...accounts[i],
        //             balance: toDecimalAmount(a.balance, DECIMALS),
        //             availableBalance: toDecimalAmount(a.availableBalance, DECIMALS),
        //             block: a.block,
        //             sequence: a.sequence,
        //         }));
        //     }
        // });
    }
};

export const onNotification = (payload: $ElementType<BlockchainNotification, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { notification } = payload;
    const account = getState().accounts.find(a => a.descriptor === notification.address);
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
            address: account.descriptor,
            from: account.block,
            history: false,
        },
        coin: account.network,
    });
    if (!updatedAccount.success) return;

    dispatch(AccountsActions.update({
        networkType: 'ripple',
        ...account,
        balance: toDecimalAmount(updatedAccount.payload.balance, DECIMALS),
        availableBalance: toDecimalAmount(updatedAccount.payload.availableBalance, DECIMALS),
        block: updatedAccount.payload.block,
        sequence: updatedAccount.payload.sequence,
        reserve: '0',
    }));
};
