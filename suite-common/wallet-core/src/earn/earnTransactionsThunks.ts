import { type TrezorDevice } from '@suite-common/suite-types';
import {
    type NotificationsRootState,
    notificationsActions,
    selectEarnTransactionNotifications,
} from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import {
    EARN_TRANSACTION_TOAST_TYPE,
    type EarnTransactionFlow,
    earnTransactionsActions,
} from './earnTransactionsReducer';

const EARN_TRANSACTIONS_MODULE_PREFIX = '@common/wallet-core/earn-transactions';

type NotifyEarnTransactionBroadcastThunkState = NotificationsRootState;

type NotifyEarnTransactionBroadcastThunkParams = {
    account: Pick<Account, 'key' | 'descriptor' | 'symbol'>;
    txid: string;
    flow: EarnTransactionFlow;
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
    ({ account, txid, flow, device, stage = 'pending', prevTxid }, { dispatch, getState }) => {
        if (prevTxid) {
            dispatch(
                earnTransactionsActions.untrackEarnTransaction({
                    accountKey: account.key,
                    txid: prevTxid,
                }),
            );
        }

        dispatch(
            earnTransactionsActions.trackEarnTransaction({ accountKey: account.key, txid, flow }),
        );

        const previousStages = selectEarnTransactionNotifications(getState(), {
            descriptor: account.descriptor,
            symbol: account.symbol,
            txid: prevTxid ?? txid,
        });

        if (previousStages.length > 0) {
            dispatch(notificationsActions.remove(previousStages));
        }

        dispatch(
            notificationsActions.addToast({
                type: EARN_TRANSACTION_TOAST_TYPE[flow],
                stage,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid,
            }),
        );
    },
);
