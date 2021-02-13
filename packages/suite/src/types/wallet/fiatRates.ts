export interface TickerId {
    symbol: string;
    mainNetworkSymbol?: string; // symbol of thee main network. (used for tokens)
    tokenAddress?: string;
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

export interface CoinFiatRates extends TickerId {
    current?: CurrentFiatRates;
    lastWeek?: LastWeekRates;
}
