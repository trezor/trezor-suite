/* @flow */

import TrezorConnect from 'trezor-connect';
import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as PENDING from 'actions/constants/pendingTx';
import * as AccountsActions from 'actions/AccountsActions';
import { toDecimalAmount } from 'utils/formatUtils';
import { observeChanges } from 'reducers/utils';

import type { BlockchainNotification } from 'trezor-connect';
import type {
    Dispatch,
    GetState,
    PromiseAction,
    PayloadAction,
    Network,
    BlockchainFeeLevel,
} from 'flowtype';

export const subscribe = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const accounts: Array<string> = getState().accounts.filter(a => a.network === network).map(a => a.descriptor);
    await TrezorConnect.blockchainSubscribe({
        accounts,
        coin: network,
    });
};

// Get current known fee
// Use default values from appConfig.json if it wasn't downloaded from blockchain yet
// update them later, after onBlockMined event
export const getFeeLevels = (network: Network): PayloadAction<Array<BlockchainFeeLevel>> => (dispatch: Dispatch, getState: GetState): Array<BlockchainFeeLevel> => {
    const blockchain = getState().blockchain.find(b => b.shortcut === network.shortcut);
    if (!blockchain || blockchain.feeLevels.length < 1) {
        return network.fee.levels.map(level => ({
            name: level.name,
            value: level.value,
        }));
    }
    return blockchain.feeLevels;
};

export const onBlockMined = (network: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const blockchain = getState().blockchain.find(b => b.shortcut === network);
    if (!blockchain) return; // flowtype fallback

    // if last update was more than 5 minutes ago
    const now = new Date().getTime();
    if (blockchain.feeTimestamp < now - 300000) {
        const feeRequest = await TrezorConnect.blockchainEstimateFee({
            coin: network,
        });
        if (feeRequest.success && observeChanges(blockchain.feeLevels, feeRequest.payload)) {
            // check if downloaded fee levels are different
            dispatch({
                type: BLOCKCHAIN.UPDATE_FEE,
                shortcut: network,
                feeLevels: feeRequest.payload,
            });
        }
    }

    // TODO: check for blockchain rollbacks here!

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
    const account = getState().accounts.find(a => a.descriptor === notification.descriptor);
    if (!account) return;
    const { network } = getState().selectedAccount;
    if (!network) return; // flowtype fallback

    if (!notification.blockHeight) {
        dispatch({
            type: PENDING.ADD,
            payload: {
                ...notification,
                deviceState: account.deviceState,
                network: account.network,

                amount: toDecimalAmount(notification.amount, network.decimals),
                total: notification.type === 'send' ? toDecimalAmount(notification.total, network.decimals) : toDecimalAmount(notification.amount, network.decimals),
                fee: toDecimalAmount(notification.fee, network.decimals),
            },
        });

        // todo: replace "send success" notification with link to explorer
    } else {
        dispatch({
            type: PENDING.TX_RESOLVED,
            hash: notification.hash,
        });
    }

    const updatedAccount = await TrezorConnect.rippleGetAccountInfo({
        account: {
            descriptor: account.descriptor,
            from: account.block,
            history: false,
        },
        coin: account.network,
    });
    if (!updatedAccount.success) return;

    dispatch(AccountsActions.update({
        networkType: 'ripple',
        ...account,
        balance: toDecimalAmount(updatedAccount.payload.balance, network.decimals),
        availableBalance: toDecimalAmount(updatedAccount.payload.availableBalance, network.decimals),
        block: updatedAccount.payload.block,
        sequence: updatedAccount.payload.sequence,
        reserve: '0',
    }));
};
