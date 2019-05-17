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

export const subscribe = (network: string): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const accounts: Array<string> = getState()
        .accounts.filter(a => a.network === network)
        .map(a => a.descriptor);
    await TrezorConnect.blockchainSubscribe({
        accounts,
        coin: network,
    });
};

// Get current known fee
// Use default values from appConfig.json if it wasn't downloaded from blockchain yet
// update them later, after onBlockMined event
export const getFeeLevels = (network: Network): PayloadAction<Array<BlockchainFeeLevel>> => (
    dispatch: Dispatch,
    getState: GetState
): Array<BlockchainFeeLevel> => {
    const blockchain = getState().blockchain.find(b => b.shortcut === network.shortcut);
    if (!blockchain || blockchain.feeLevels.length < 1) {
        return network.fee.levels.map(level => ({
            name: level.name,
            value: level.value,
        }));
    }
    return blockchain.feeLevels;
};

export const onBlockMined = (networkShortcut: string, block: number): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const blockchain = getState().blockchain.find(b => b.shortcut === networkShortcut);
    if (!blockchain) return; // flowtype fallback

    // if last update was more than 5 minutes ago
    const now = new Date().getTime();
    if (blockchain.feeTimestamp < now - 300000) {
        const feeRequest = await TrezorConnect.blockchainEstimateFee({
            coin: networkShortcut,
        });
        if (feeRequest.success && observeChanges(blockchain.feeLevels, feeRequest.payload)) {
            // check if downloaded fee levels are different
            dispatch({
                type: BLOCKCHAIN.UPDATE_FEE,
                shortcut: networkShortcut,
                feeLevels: feeRequest.payload,
            });
        }
    }

    // TODO: check for blockchain rollbacks here!

    const accounts: Array<any> = getState().accounts.filter(a => a.network === networkShortcut);
    if (accounts.length === 0) return;
    const { networks } = getState().localStorage.config;
    const network = networks.find(c => c.shortcut === networkShortcut);
    if (!network) return;

    // HACK: Since Connect always returns account.transactions as 0
    // we don't have info about new transactions for the account since last update.
    // Untill there is a better solution compare accounts block.
    // If we missed some blocks (wallet was offline) we'll update the account reducer
    // If we are update to date with the last block that means wallet was online
    // and we will get Blockchain notification about new transaction if needed
    accounts.forEach(async account => {
        const missingBlocks = account.block !== block - 1;
        if (!missingBlocks) {
            // account was last updated on account.block, current block is +1, we didn't miss single block
            // if there was new tx, blockchain notification would let us know
            // so just update the block for the account
            dispatch(
                AccountsActions.update({
                    ...account,
                    block,
                })
            );
        } else {
            // we missed some blocks (wallet was offline). get updated account info from connect
            const response = await TrezorConnect.rippleGetAccountInfo({
                account: {
                    descriptor: account.descriptor,
                },
                level: 'transactions',
                coin: networkShortcut,
            });

            if (!response.success) return;

            const updatedAccount = response.payload;

            // new txs
            dispatch(
                AccountsActions.update({
                    ...account,
                    balance: toDecimalAmount(updatedAccount.balance, network.decimals),
                    availableBalance: toDecimalAmount(
                        updatedAccount.availableBalance,
                        network.decimals
                    ),
                    block: updatedAccount.block,
                    sequence: updatedAccount.sequence,
                })
            );
        }
    });
};

export const onNotification = (
    payload: $ElementType<BlockchainNotification, 'payload'>
): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
                total:
                    notification.type === 'send'
                        ? toDecimalAmount(notification.total, network.decimals)
                        : toDecimalAmount(notification.amount, network.decimals),
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

    const empty = updatedAccount.payload.sequence <= 0 && updatedAccount.payload.balance === '0';
    dispatch(
        AccountsActions.update({
            networkType: 'ripple',
            ...account,
            balance: toDecimalAmount(updatedAccount.payload.balance, network.decimals),
            availableBalance: toDecimalAmount(
                updatedAccount.payload.availableBalance,
                network.decimals
            ),
            block: updatedAccount.payload.block,
            sequence: updatedAccount.payload.sequence,
            reserve: '0',
            empty,
        })
    );
};
