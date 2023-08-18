import { createAction } from '@reduxjs/toolkit';

import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';

import { actionPrefix } from './constants';

type UpdateTransactionFiatRatePayload = Array<{
    txid: string;
    account: Account;
    updateObject: Partial<WalletAccountTransaction>;
    ts: number;
}>;

const updateTransactionFiatRate = createAction(
    `${actionPrefix}/updateTransactionFiatRate`,
    (payload: UpdateTransactionFiatRatePayload) => ({
        payload,
    }),
);

export const fiatRatesActions = {
    updateTransactionFiatRate,
} as const;
