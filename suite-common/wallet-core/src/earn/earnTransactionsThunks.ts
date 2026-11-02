import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type NotificationsRootState,
    notificationsActions,
    selectEarnTransactionNotifications,
    selectIsEarnTransactionConfirmationNotified,
} from '@suite-common/toast-notifications';
import {
    type Account,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type PrecomposedTransactionFinalCancelRbf,
} from '@suite-common/wallet-types';
import { isRbfBumpFeeTransaction, isRbfCancelTransaction } from '@suite-common/wallet-utils';
import { createThunk } from '@trezor/redux-utils';

import {
    EARN_TRANSACTION_TOAST_TYPE,
    type EarnTransactionFlow,
    type EarnTransactionsRootState,
    earnTransactionsActions,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { transactionsActions } from '../transactions/transactionsActions';

const EARN_TRANSACTIONS_MODULE_PREFIX = '@common/wallet-core/earn-transactions';

type NotifyEarnTransactionBroadcastThunkState = NotificationsRootState;

type NotifyEarnTransactionBroadcastThunkParams = {
    account: Account;
    txid: string;
    flow: EarnTransactionFlow;
    isCancellation?: boolean;
    device?: TrezorDevice;
    stage?: 'pending' | 'sped-up';
    prevTxid?: string;
};

export const notifyEarnTransactionBroadcastThunk = createThunk<
    void,
    NotifyEarnTransactionBroadcastThunkParams,
    { state: NotifyEarnTransactionBroadcastThunkState }
>(
    `${EARN_TRANSACTIONS_MODULE_PREFIX}/notifyEarnTransactionBroadcastThunk`,
    (
        { account, txid, flow, isCancellation = false, device, stage = 'pending', prevTxid },
        { dispatch, getState },
    ) => {
        if (prevTxid) {
            dispatch(
                earnTransactionsActions.untrackEarnTransaction({
                    accountKey: account.key,
                    txid: prevTxid,
                }),
            );
        }

        const previousStages = selectEarnTransactionNotifications(getState(), {
            descriptor: account.descriptor,
            symbol: account.symbol,
            txid: prevTxid ?? txid,
        });
        if (previousStages.length > 0) {
            dispatch(notificationsActions.remove(previousStages));
        }

        dispatch(
            transactionsActions.transactionBroadcastStatus({
                account,
                txid,
                flow,
                status: 'success',
                isCancellation,
                isRbf: !!prevTxid,
            }),
        );

        const toastType = EARN_TRANSACTION_TOAST_TYPE[flow];
        if (
            !toastType ||
            isCancellation ||
            selectIsEarnTransactionConfirmationNotified(getState(), {
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid,
            })
        ) {
            return;
        }

        dispatch(
            notificationsActions.addToast({
                type: toastType,
                stage,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid,
            }),
        );
    },
);

export type HandleEarnTransactionReplacementThunkState = EarnTransactionsRootState &
    NotificationsRootState;

type HandleEarnTransactionReplacementThunkParams = {
    account: Account;
    device?: TrezorDevice;
    precomposedTransaction:
        PrecomposedTransactionFinalBumpFeeRbf | PrecomposedTransactionFinalCancelRbf;
    txid: string | null;
};

export const handleEarnTransactionReplacementThunk = createThunk<
    boolean,
    HandleEarnTransactionReplacementThunkParams,
    { state: HandleEarnTransactionReplacementThunkState }
>(
    `${EARN_TRANSACTIONS_MODULE_PREFIX}/handleEarnTransactionReplacementThunk`,
    ({ account, device, precomposedTransaction, txid }, { dispatch, getState }) => {
        const previous = selectTrackedEarnTransaction(
            getState(),
            account.key,
            precomposedTransaction.prevTxid,
        );
        if (!previous) return false;

        const isCancellation =
            previous.isCancellation || isRbfCancelTransaction(precomposedTransaction);
        const transaction = { account, flow: previous.flow, isCancellation };
        if (txid === null) {
            dispatch(
                transactionsActions.transactionBroadcastStatus({
                    ...transaction,
                    status: 'error',
                    isRbf: true,
                }),
            );

            return false;
        }

        if (isRbfBumpFeeTransaction(precomposedTransaction)) {
            dispatch(
                notifyEarnTransactionBroadcastThunk({
                    ...transaction,
                    txid,
                    device,
                    stage: 'sped-up',
                    prevTxid: precomposedTransaction.prevTxid,
                }),
            );

            return !isCancellation && !!EARN_TRANSACTION_TOAST_TYPE[previous.flow];
        }

        dispatch(
            transactionsActions.transactionBroadcastStatus({
                ...transaction,
                txid,
                status: 'success',
                isRbf: true,
            }),
        );

        return false;
    },
);
