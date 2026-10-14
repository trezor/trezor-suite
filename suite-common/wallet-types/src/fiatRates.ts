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

type RateType = 'current' | 'lastWeek' | 'historic';
export type RateTypeWithoutHistoric = Exclude<RateType, 'historic'>;

type RateStatus = {
    lastTickerTimestamp: Timestamp;
    lastSuccessfulFetchTimestamp: Timestamp;
    isLoading: boolean;
    error: string | null;
    ticker: TickerId;
};

export type Rate = RateStatus & {
    rate?: number;
};

/**
 * A current entry holds no numbers until its first answer lands, and both from then on: a current
 * rate never comes without its dollar rate (see `CurrentFiatRatesResult`).
 */
export type CurrentRate = RateStatus &
    ({ rate: number; usdRate: number } | { rate?: undefined; usdRate?: undefined });

export type FiatRatesResult = {
    rate?: number;
    lastTickerTimestamp: Timestamp;
};

/**
 * A current rate always comes with the dollar rate, whatever the chosen currency: CoinGecko returns
 * every currency it knows, dollars included, and Blockbook is asked for dollars next to the chosen
 * one. A provider answer missing either number is no rate at all, so neither is ever undefined here.
 */
export type CurrentFiatRatesResult = {
    rate: number;
    usdRate: number;
    lastTickerTimestamp: Timestamp;
};

export type TickerResult = {
    tickerId: TickerId;
    localCurrency: BaseCurrencyCode;
    rates: FiatRatesResult[];
};

export type RatesByKey = Record<CryptoBaseCurrencyPair, Rate>;
export type CurrentRatesByKey = Record<CryptoBaseCurrencyPair, CurrentRate>;
export type RatesByTimestamps = Record<CryptoBaseCurrencyPair, Record<Timestamp, number>>;
