import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type NotificationsRootState,
    notificationsActions,
} from '@suite-common/toast-notifications';
import {
    type Account,
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type StakeType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getMevProtectedTxData,
    isCardanoTx,
    isRbfBumpFeeTransaction,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { createThunk } from '@trezor/redux-utils';

import { selectStake } from './shared/stakingSelectors';
import { STAKE_MODULE_PREFIX, stakeActions } from './stakingActions';
import { type StakeRootState } from './stakingReducerTypes';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    type SyncAccountsWithBlockchainThunkDeps,
    type SyncAccountsWithBlockchainThunkState,
    syncAccountsWithBlockchainThunk,
} from '../blockchain/blockchainThunks';
import { type EarnTransactionsRootState } from '../earn/earnTransactionsReducer';
import { notifyEarnTransactionBroadcastThunk } from '../earn/earnTransactionsThunks';
import {
    type SynchronizeSentTransactionThunkState,
    synchronizeSentTransactionThunk,
} from '../send/sendFormThunks';
import {
    type PushTransactionError,
    type SerializedTx,
    type SignTransactionError,
} from '../send/sendFormTypes';
import {
    type WalletSettingsRootState,
    selectIsMevProtectionEnabled,
} from '../settings/walletSettingsReducer';
import { transactionsActions } from '../transactions/transactionsActions';
import {
    type ReplaceTransactionThunkState,
    addFakePendingCardanoTxThunk,
    replaceTransactionThunk,
} from '../transactions/transactionsThunks';

const PUSH_LOG_PREFIX = 'pushStakeTransactionThunk';

const getCardanoStakingSpecific = (
    stakeType: StakeType,
): WalletAccountTransaction['cardanoSpecific'] => {
    const base = { withdrawal: undefined, deposit: undefined };

    switch (stakeType) {
        case 'stake':
            return { ...base, subtype: 'stake_registration' };
        case 'change-delegate':
            return { ...base, subtype: 'governance_delegation' };
        case 'unstake':
            return { ...base, subtype: 'stake_deregistration' };
        case 'claim':
            return { ...base, subtype: 'withdrawal' };
    }
};

type SynchronizePushedStakeTransactionParams = {
    account: Account;
    stakeType: StakeType;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    precomposedForm?: FormState;
    txid: string;
};

type SynchronizePushedStakeTransactionThunkState = StakeRootState &
    SynchronizeSentTransactionThunkState &
    SyncAccountsWithBlockchainThunkState;

type SynchronizePushedStakeTransactionThunkDeps = SyncAccountsWithBlockchainThunkDeps;

// Cardano staking has its own pending transaction subtype and spends the confirmed voting
// delegation; every other network is synchronized like a sent transaction.
const synchronizePushedStakeTransactionThunk = createThunk<
    void,
    SynchronizePushedStakeTransactionParams,
    {
        state: SynchronizePushedStakeTransactionThunkState;
        extra: SynchronizePushedStakeTransactionThunkDeps;
    }
>(
    `${STAKE_MODULE_PREFIX}/synchronizePushedStakeTransactionThunk`,
    (
        { account, stakeType, precomposedTransaction, precomposedForm, txid },
        { dispatch, getState },
    ) => {
        if (isCardanoTx(account, precomposedTransaction)) {
            dispatch(
                addFakePendingCardanoTxThunk({
                    precomposedTransaction,
                    txid,
                    account,
                    cardanoSpecific: getCardanoStakingSpecific(stakeType),
                }),
            );
            // The confirmed selection is spent by this transaction; keeping it would let it
            // reach the next plan composed for this account.
            dispatch(stakeActions.clearAccountVotingDelegation());
            dispatch(syncAccountsWithBlockchainThunk(account.symbol));

            return;
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction,
                precomposedForm,
                txid,
                ethereumNonce: selectStake(getState()).resolvedEthereumNonce,
            }),
        );
    },
);

export type PushStakeTransactionError = SignTransactionError | PushTransactionError | undefined;

export type PushStakeTransactionThunkParams = {
    accountKey: AccountKey;
    stakeType: StakeType;
    serializedTx: SerializedTx;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    precomposedForm?: FormState;
    // MEV protection availability is app-specific (message-system feature flag), so the caller
    // resolves it (e.g. via `selectIsMevProtectionFeatureEnabled` from `@suite-common/mev`).
    isMevProtectionFeatureEnabled: boolean;
};

export type PushStakeTransactionThunkState = DeviceRootState &
    EarnTransactionsRootState &
    NotificationsRootState &
    ReplaceTransactionThunkState &
    StakeRootState &
    SynchronizeSentTransactionThunkState &
    SyncAccountsWithBlockchainThunkState &
    WalletSettingsRootState;

export type PushStakeTransactionThunkDeps = SyncAccountsWithBlockchainThunkDeps;

// Broadcasts a signed staking transaction and applies the shared post-push effects: the earn
// toast, the pending transaction the backend will only report later and the account sync.
// Callers own their review state and pass the signed transaction in.
export const pushStakeTransactionThunk = createThunk<
    { txid: string },
    PushStakeTransactionThunkParams,
    {
        rejectValue: PushStakeTransactionError;
        state: PushStakeTransactionThunkState;
        extra: PushStakeTransactionThunkDeps;
    }
>(
    `${STAKE_MODULE_PREFIX}/${PUSH_LOG_PREFIX}`,
    async (
        {
            accountKey,
            stakeType,
            serializedTx,
            precomposedTransaction,
            precomposedForm,
            isMevProtectionFeatureEnabled,
        },
        { dispatch, getState, rejectWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            console.error(`${PUSH_LOG_PREFIX}: Account not found.`);

            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account not found.',
            });
        }

        const device = selectSelectedDevice(getState());
        const flow = stakeType === 'change-delegate' ? 'vote' : stakeType;
        const isMevProtectionEnabled =
            account.networkType === 'ethereum'
                ? selectIsMevProtectionEnabled(getState()) && isMevProtectionFeatureEnabled
                : false;

        const sentTx = await TrezorConnect.pushTransaction({
            tx: getMevProtectedTxData(serializedTx.symbol, serializedTx.tx, isMevProtectionEnabled),
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
        });

        if (!sentTx.success) {
            console.error(`${PUSH_LOG_PREFIX}: Push transaction failed.`);

            dispatch(
                transactionsActions.transactionBroadcastStatus({
                    account,
                    flow,
                    status: 'error',
                    isRbf: isRbfBumpFeeTransaction(precomposedTransaction),
                }),
            );
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: sentTx.error.message,
                }),
            );

            const isPendingConflict = sentTx.error.message.includes(
                'could not replace existing tx',
            );

            return rejectWithValue({
                error: isPendingConflict
                    ? 'push-transaction-pending-conflict'
                    : 'push-transaction-failed',
                metadata: sentTx,
            });
        }

        const { txid } = sentTx.payload;
        const bumpedPrevTxid = isRbfBumpFeeTransaction(precomposedTransaction)
            ? precomposedTransaction.prevTxid
            : undefined;

        dispatch(
            notifyEarnTransactionBroadcastThunk({
                account,
                device,
                txid,
                flow,
                stage: bumpedPrevTxid ? 'sped-up' : 'pending',
                prevTxid: bumpedPrevTxid,
            }),
        );

        if (isRbfBumpFeeTransaction(precomposedTransaction)) {
            // notification from the backend may be delayed.
            // modify affected transaction(s) in the reducer until the real account update occurs.
            // this will update transaction details (like time, fee etc.)
            dispatch(replaceTransactionThunk({ precomposedTransaction, newTxid: txid }));
        }

        dispatch(
            synchronizePushedStakeTransactionThunk({
                account,
                stakeType,
                precomposedTransaction,
                precomposedForm,
                txid,
            }),
        );

        return { txid };
    },
);
