import { BlockchainBlock } from '@trezor/connect';
import { CARDANO_STAKING } from '@wallet-actions/constants';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Account, WalletAccountTransaction } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import * as transactionActions from '@wallet-actions/transactionActions';
import { PendingStakeTx } from '@wallet-types/cardanoStaking';
import { getUnixTime } from 'date-fns';
import { isPending } from '@wallet-utils/transactionUtils';
import { CARDANO_DEFAULT_TTL_OFFSET } from '@wallet-constants/sendForm';

export type CardanoStakingAction =
    | { type: typeof CARDANO_STAKING.ADD_PENDING_STAKE_TX; pendingStakeTx: PendingStakeTx }
    | { type: typeof CARDANO_STAKING.REMOVE_PENDING_STAKE_TX; accountKey: string };

export const getPendingStakeTx =
    (account: Account) => (_dispatch: Dispatch, getState: GetState) => {
        const pendingTx = getState().wallet.cardanoStaking.pendingTx.find(
            tx => tx.accountKey === account.key,
        );
        return pendingTx;
    };

export const setPendingStakeTx =
    (account: Account, payload: string | null) => (dispatch: Dispatch) => {
        const accountKey = accountUtils.getAccountKey(
            account.descriptor,
            account.symbol,
            account.deviceState,
        );
        if (payload) {
            dispatch({
                type: CARDANO_STAKING.ADD_PENDING_STAKE_TX,
                pendingStakeTx: {
                    accountKey,
                    txid: payload,
                    ts: getUnixTime(new Date()),
                },
            });
        } else {
            dispatch({
                type: CARDANO_STAKING.REMOVE_PENDING_STAKE_TX,
                accountKey,
            });
        }
    };

export const validatePendingTxOnBlock =
    (block: BlockchainBlock, ts: number) => (dispatch: Dispatch, getState: GetState) => {
        // Used in cardano staking
        // After sending staking tx (delegation or withdrawal) user needs to wait few blocks til the tx appears on the blockchain.
        // To prevent the user from sending multiple staking tx we need to track that we are waiting for confirmation for the tx that was already sent.
        // As a failsafe, we will reset `pendingStakeTx` after tx expires (ttl is set to 2 hours), allowing user to retry the action.
        const network = accountUtils.getNetwork(block.coin.shortcut.toLowerCase());
        if (!network || network.networkType !== 'cardano') return;

        const accounts = getState().wallet.accounts.filter(
            account => account.networkType === 'cardano' && network.symbol === account.symbol,
        );

        accounts.forEach(account => {
            // just to make ts happy, filtering is already done above
            if (account.networkType !== 'cardano') return;

            const accountPendingTransactions = accountUtils
                .getAccountTransactions(getState().wallet.transactions.transactions, account)
                .filter(tx => isPending(tx));

            accountPendingTransactions.forEach(tx => {
                if (tx.blockTime && ts - tx.blockTime > CARDANO_DEFAULT_TTL_OFFSET) {
                    // all txs from suite have ttl set to 2h
                    // tx will be rejected by the network if is not included in the blockchain in <2h
                    dispatch(transactionActions.remove(account, [tx]));
                }
            });

            // separate pending tx used for nicer UI
            const pendingStakeTx = dispatch(getPendingStakeTx(account));
            if (pendingStakeTx && ts - pendingStakeTx.ts > CARDANO_DEFAULT_TTL_OFFSET) {
                dispatch(setPendingStakeTx(account, null));
            }
        });
    };

export const validatePendingStakeTxOnTx =
    (account: Account, txs: WalletAccountTransaction[]) => (dispatch: Dispatch) => {
        if (account.networkType !== 'cardano') return;
        const pendingTx = dispatch(getPendingStakeTx(account));

        // remove pending stake tx only if the incoming tx had blockHeight set
        // otherwise it is fake pending tx we manually set after pushing the tx to a blockchain
        if (txs.find(tx => tx.txid === pendingTx?.txid && !!tx.blockHeight)) {
            dispatch(setPendingStakeTx(account, null));
        }
    };
