import type { FiatRatesLegacy } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { TokenAddress } from './account';

export interface TickerId {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
}

export interface CurrentFiatRates {
    symbol: string;
    rates: FiatRatesLegacy;
    ts: number;
}

export interface TimestampedRates {
    rates: FiatRatesLegacy;
    ts: number;
}

export interface LastWeekRates {
    symbol: string;
    tickers: TimestampedRates[];
    ts: number;
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
};

export type FiatRates = Record<FiatRateKey, Rate>;
