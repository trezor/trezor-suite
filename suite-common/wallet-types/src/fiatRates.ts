import type { FiatRates } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { TokenAddress } from './account';

export interface TickerId {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    mainNetworkSymbol?: string; // symbol of the main network. (used for tokens)
}

export interface CurrentFiatRates {
    symbol: string;
    rates: FiatRates;
    ts: number;
}

export interface TimestampedRates {
    rates: FiatRates;
    ts: number;
}

export interface LastWeekRates {
    symbol: string;
    tickers: TimestampedRates[];
    ts: number;
}

export interface CoinFiatRates extends TickerId {
    current?: CurrentFiatRates;
    lastWeek?: LastWeekRates;
}

export type FiatRateKey = string & { __type: 'FiatRateKey' };

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

export interface FiatRatesStateLegacy {
    coins: CoinFiatRates[];
}
