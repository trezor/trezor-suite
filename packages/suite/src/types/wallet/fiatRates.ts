export interface FiatTicker {
    symbol: string;
    url?: string;
    mainNetworkSymbol?: string; // symbol of thee main network. (used for tokens)
}

export type GraphRange =
    | {
          label: 'week' | 'month' | 'year';
          weeks: number;
      }
    | {
          label: 'all';
          weeks: null;
      };

export type GraphTicksInterval = 'month' | 'day' | '2-day';
export interface AggregatedAccountBalanceHistory {
    time: number;
    txs: number;
    sentFiat: {
        [key: string]: string | undefined;
    };
    receivedFiat: {
        [key: string]: string | undefined;
    };
}
