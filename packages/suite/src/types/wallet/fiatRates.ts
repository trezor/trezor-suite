export interface CoinListItem {
    id: string;
    symbol: string;
    name: string;
}

export interface FiatTicker {
    symbol: string;
    coinData?: CoinListItem; // coingecko metadata including identifier used for request
    mainNetworkSymbol?: string; // symbol of thee main network. (used for tokens)
}

export interface CurrentFiatRates {
    symbol: string;
    rates: { [key: string]: number | undefined };
    ts: number;
}

export interface TimestampedRates {
    rates: { [key: string]: number | undefined };
    ts: number;
}

export interface LastWeekRates {
    symbol: string;
    tickers: TimestampedRates[];
    ts: number;
}

export interface CoinFiatRates {
    current?: CurrentFiatRates;
    lastWeek?: LastWeekRates;
    symbol: string;
    mainNetworkSymbol?: string;
}
