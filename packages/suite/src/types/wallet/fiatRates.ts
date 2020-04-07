export interface FiatTicker {
    symbol: string;
    url?: string;
    mainNetworkSymbol?: string; // symbol of thee main network. (used for tokens)
}

export interface GraphRange {
    label: string;
    weeks: number;
}

export type GraphTicksInterval = 'month' | 'day' | '2-day';
export interface AggregatedAccountBalanceHistory {
    time: number;
    txs: number;
    sentFiat: {
        [key: string]: string;
    };
    receivedFiat: {
        [key: string]: string;
    };
}
