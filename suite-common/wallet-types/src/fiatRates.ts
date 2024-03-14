import type { FiatRatesBySymbol } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import { TokenAddress } from './account';

export interface TickerId {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
}

export interface TimestampedRates {
    rates: FiatRatesBySymbol;
    ts: number;
}

export interface HistoricRates {
    symbol: string;
    tickers: TimestampedRates[];
    ts: number;
}

export type FiatRateKey = string & { __type: 'FiatRateKey' };

export type Timestamp = number & { __type: 'Timestamp' };

export type RateType = 'current' | 'lastWeek' | 'historic';
export type RateTypeWithoutHistoric = Exclude<RateType, 'historic'>;

export type Rate = {
    rate?: number;
    lastTickerTimestamp: Timestamp;
    lastSuccessfulFetchTimestamp: Timestamp;
    isLoading: boolean;
    error: string | null;
    ticker: TickerId;
};

export type FiatRatesResult = {
    rate?: number;
    lastTickerTimestamp: Timestamp;
};

export type TickerResult = {
    tickerId: TickerId;
    localCurrency: FiatCurrencyCode;
    rates: FiatRatesResult[];
};

export type FiatRates = Record<FiatRateKey, Rate>;
export type RatesByKey = Record<FiatRateKey, Rate>;
export type RatesByTimestamps = Record<FiatRateKey, Record<Timestamp, number>>;
