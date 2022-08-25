import { createAction } from '@reduxjs/toolkit';

import {
    Account,
    CoinFiatRates,
    TickerId,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { Network } from '@suite-common/wallet-config';

import { actionPrefix } from './constants';

type FiatRatesPayload = NonNullable<CoinFiatRates['current']>;
type UpdateFiatRatePayload = {
    ticker: TickerId;
    payload: FiatRatesPayload;
};
type UpdateTransactionFiatRatePayload = Array<{
    txid: string;
    account: Account;
    updateObject: Partial<WalletAccountTransaction>;
    ts: number;
}>;
type LastWeekRatesPayload = {
    symbol: Network['symbol'] | string;
    tickers: NonNullable<CoinFiatRates['lastWeek']>['tickers'];
    ts: number;
};

const removeFiatRate = createAction(
    `${actionPrefix}/removeFiatRate`,
    (payload: TickerId): { payload: TickerId } => ({
        payload,
    }),
);

const updateFiatRate = createAction(
    `${actionPrefix}/updateFiatRate`,
    (
        payload: UpdateFiatRatePayload,
    ): {
        payload: UpdateFiatRatePayload;
    } => ({
        payload,
    }),
);

const updateTransactionFiatRate = createAction(
    `${actionPrefix}/updateTransactionFiatRate`,
    (payload: UpdateTransactionFiatRatePayload): { payload: UpdateTransactionFiatRatePayload } => ({
        payload,
    }),
);

const updateLastWeekRates = createAction(
    `${actionPrefix}/updateLastWeekRates`,
    (payload: LastWeekRatesPayload): { payload: LastWeekRatesPayload } => ({
        payload,
    }),
);

export const fiatRatesActions = {
    removeFiatRate,
    updateFiatRate,
    updateLastWeekRates,
    updateTransactionFiatRate,
} as const;
