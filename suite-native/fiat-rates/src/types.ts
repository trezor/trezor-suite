import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, TransactionsRootState } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';

export type FiatRateKey = string & { __type: 'FiatRateKey' };

export interface TickerId {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
}

export type Timestamp = number & { __type: 'Timestamp' };

export type RateType = 'current' | 'lastWeek';

export type Rate = {
    rate?: number;

    lastSuccessfulFetchTimestamp: Timestamp;

    isLoading: boolean;
    error: string | null;

    ticker: TickerId;
    // only useful for selectFiatRatesLegacy selector, once we get rid of it, we can remove this
    locale: FiatCurrencyCode;
};

export type FiatRatesState = Record<RateType, Record<FiatRateKey, Rate>>;

export type FiatRatesRootState = {
    wallet: {
        fiat: FiatRatesState;
    };
} & AccountsRootState &
    TransactionsRootState;
