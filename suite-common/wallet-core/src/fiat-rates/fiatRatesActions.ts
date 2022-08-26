import { createAction } from '@reduxjs/toolkit';

import {
    Account,
    CoinFiatRates,
    TickerId,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

export const actionPrefix = '@common/wallet-core/fiat-rates';

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
    symbol: NetworkSymbol | string;
    tickers: NonNullable<CoinFiatRates['lastWeek']>['tickers'];
    ts: number;
};

const removeFiatRate = createAction(`${actionPrefix}/removeFiatRate`, (payload: TickerId) => ({
    payload,
}));

const updateFiatRate = createAction(
    `${actionPrefix}/updateFiatRate`,
    (payload: UpdateFiatRatePayload) => ({
        payload,
    }),
);

const updateTransactionFiatRate = createAction(
    `${actionPrefix}/updateTransactionFiatRate`,
    (payload: UpdateTransactionFiatRatePayload) => ({
        payload,
    }),
);

const updateLastWeekFiatRates = createAction(
    `${actionPrefix}/updateLastWeekRates`,
    (payload: LastWeekRatesPayload) => ({
        payload,
    }),
);

export const fiatRatesActions = {
    removeFiatRate,
    updateFiatRate,
    updateLastWeekFiatRates,
    updateTransactionFiatRate,
} as const;
