import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { FiatRatesBySymbol } from '@trezor/connect';
import { type Branded } from '@trezor/type-utils';

import { type TokenAddress } from './account';

export interface TickerId {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    protocols?: 'erc4626'[];
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

export type CryptoBaseCurrencyPair = string & Branded<'CryptoBaseCurrencyCode'>;
export const asCryptoBaseCurrencyCode = (value: string) => value as CryptoBaseCurrencyPair;

// Unix Timestamp in milliseconds
export type Timestamp = number & Branded<'Timestamp'>;
export const asTimestamp = (number: number) => number as Timestamp;

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
    localCurrency: BaseCurrencyCode;
    rates: FiatRatesResult[];
};

export type RatesByKey = Record<CryptoBaseCurrencyPair, Rate>;
export type RatesByTimestamps = Record<CryptoBaseCurrencyPair, Record<Timestamp, number>>;
