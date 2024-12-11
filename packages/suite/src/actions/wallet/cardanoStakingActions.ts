import { getUnixTime } from 'date-fns';

import { BlockchainBlock } from '@trezor/connect';
import {
    CARDANO_STAKE_POOL_PREVIEW_URL,
    CARDANO_STAKE_POOL_MAINNET_URL,
    CARDANO_MAINNET_DREP,
    CARDANO_PREVIEW_DREP,
} from '@trezor/urls';
import { isPending, getAccountTransactions, getNetworkName } from '@suite-common/wallet-utils';
import { CARDANO_DEFAULT_TTL_OFFSET } from '@suite-common/wallet-constants';
import { transactionsActions } from '@suite-common/wallet-core';
import { getNetworkOptional } from '@suite-common/wallet-config';

import { CARDANO_STAKING } from 'src/actions/wallet/constants';
import {
    PendingStakeTx,
    PoolsResponse,
    CardanoNetwork,
    DRepResponse,
} from 'src/types/wallet/cardanoStaking';
import { Account, WalletAccountTransaction } from 'src/types/wallet';
import { Dispatch, GetState } from 'src/types/suite';

export type CardanoStakingAction =
    | { type: typeof CARDANO_STAKING.ADD_PENDING_STAKE_TX; pendingStakeTx: PendingStakeTx }
    | { type: typeof CARDANO_STAKING.REMOVE_PENDING_STAKE_TX; accountKey: string }
    | {
          type: typeof CARDANO_STAKING.SET_TREZOR_DATA;
          trezorPools: PoolsResponse;
          trezorDRep: DRepResponse;
          network: CardanoNetwork;
      }
    | { type: typeof CARDANO_STAKING.SET_FETCH_ERROR; error: boolean; network: CardanoNetwork }
    | { type: typeof CARDANO_STAKING.SET_FETCH_LOADING; loading: boolean; network: CardanoNetwork };

export const getPendingStakeTx =
    (account: Account) => (_dispatch: Dispatch, getState: GetState) => {
        const pendingTx = getState().wallet.cardanoStaking.pendingTx.find(
            tx => tx.accountKey === account.key,
        );

        return pendingTx;
    };

export const setPendingStakeTx =
    (account: Account, payload: string | null) => (dispatch: Dispatch) => {
        if (payload) {
            dispatch({
                type: CARDANO_STAKING.ADD_PENDING_STAKE_TX,
                pendingStakeTx: {
                    accountKey: account.key,
                    txid: payload,
                    ts: getUnixTime(new Date()),
                },
            });
        } else {
            dispatch({
                type: CARDANO_STAKING.REMOVE_PENDING_STAKE_TX,
                accountKey: account.key,
            });
        }
    };

export const validatePendingTxOnBlock =
    ({ block, timestamp }: { block: BlockchainBlock; timestamp: number }) =>
    (dispatch: Dispatch, getState: GetState) => {
        // Used in cardano staking
        // After sending staking tx (delegation or withdrawal) user needs to wait few blocks til the tx appears on the blockchain.
        // To prevent the user from sending multiple staking tx we need to track that we are waiting for confirmation for the tx that was already sent.
        // As a failsafe, we will reset `pendingStakeTx` after tx expires (ttl is set to 2 hours), allowing user to retry the action.
        const network = getNetworkOptional(block.coin.shortcut.toLowerCase());
        if (!network || network.networkType !== 'cardano') return;

        const accounts = getState().wallet.accounts.filter(
            account => account.networkType === 'cardano' && network.symbol === account.symbol,
        );

        accounts.forEach(account => {
            // just to make ts happy, filtering is already done above
            if (account.networkType !== 'cardano') return;

            const accountPendingTransactions = getAccountTransactions(
                account.key,
                getState().wallet.transactions.transactions,
            ).filter(tx => isPending(tx));

            accountPendingTransactions.forEach(tx => {
                if (tx.blockTime && timestamp - tx.blockTime > CARDANO_DEFAULT_TTL_OFFSET) {
                    // all txs from suite have ttl set to 2h
                    // tx will be rejected by the network if is not included in the blockchain in <2h
                    dispatch(transactionsActions.removeTransaction({ account, txs: [tx] }));
                }
            });

            // separate pending tx used for nicer UI
            const pendingStakeTx = dispatch(getPendingStakeTx(account));
            if (pendingStakeTx && timestamp - pendingStakeTx.ts > CARDANO_DEFAULT_TTL_OFFSET) {
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

export const fetchTrezorData = (network: 'ADA' | 'tADA') => async (dispatch: Dispatch) => {
    const cardanoNetwork = getNetworkName(network);

    dispatch({
        type: CARDANO_STAKING.SET_FETCH_LOADING,
        loading: true,
        network: cardanoNetwork,
    });

    try {
        // Fetch ID of Trezor stake pool that will be used in delegation transaction
        const urlPools =
            cardanoNetwork === 'mainnet'
                ? CARDANO_STAKE_POOL_MAINNET_URL
                : CARDANO_STAKE_POOL_PREVIEW_URL;

        const responsePools = await fetch(urlPools, { credentials: 'same-origin' });
        const responsePoolsJson = await responsePools.json();

        if (
            !responsePoolsJson ||
            !('next' in responsePoolsJson) ||
            !('pools' in responsePoolsJson)
        ) {
            throw new Error('Cardano: fetchTrezorPools: Invalid data format');
        }

        // Fetch DRep for transaction withdrawal
        const urlDRep = cardanoNetwork === 'mainnet' ? CARDANO_MAINNET_DREP : CARDANO_PREVIEW_DREP;

        const responseDRep = await fetch(urlDRep, { credentials: 'same-origin' });
        const responseDRepJson = await responseDRep.json();

        if (!responseDRepJson || !('drep' in responseDRepJson)) {
            throw new Error('Cardano: fetchTrezorDRep: Invalid data format');
        }

        dispatch({
            type: CARDANO_STAKING.SET_TREZOR_DATA,
            trezorPools: responsePoolsJson as PoolsResponse,
            trezorDRep: responseDRepJson as DRepResponse,
            network: cardanoNetwork,
        });
    } catch {
        dispatch({
            type: CARDANO_STAKING.SET_FETCH_ERROR,
            error: true,
            network: cardanoNetwork,
        });
    }
    dispatch({
        type: CARDANO_STAKING.SET_FETCH_LOADING,
        loading: false,
        network: cardanoNetwork,
    });
};
