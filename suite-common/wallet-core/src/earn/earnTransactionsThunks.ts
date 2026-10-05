import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';

import {
    EARN_TRANSACTION_TOAST_TYPE,
    type EarnTransactionFlow,
    earnTransactionsActions,
} from './earnTransactionsReducer';

const EARN_TRANSACTIONS_MODULE_PREFIX = '@common/wallet-core/earn-transactions';

type NotifyEarnTransactionBroadcastThunkParams = {
    account: Pick<Account, 'key' | 'descriptor' | 'symbol'>;
    txid: string;
    flow: EarnTransactionFlow;
    device?: TrezorDevice;
    stage?: 'pending' | 'sped-up';
};

export const notifyEarnTransactionBroadcastThunk = createThunk<
    void,
    NotifyEarnTransactionBroadcastThunkParams,
    void
>(
    `${EARN_TRANSACTIONS_MODULE_PREFIX}/notifyEarnTransactionBroadcastThunk`,
    ({ account, txid, flow, device, stage = 'pending' }, { dispatch }) => {
        dispatch(
            earnTransactionsActions.trackEarnTransaction({ accountKey: account.key, txid, flow }),
        );
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
