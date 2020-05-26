export interface FiatTicker {
    symbol: string;
    url?: string;
    mainNetworkSymbol?: string; // symbol of thee main network. (used for tokens)
}

export type GraphRange =
    | {
          label: 'week' | 'month' | 'year';
          weeks: number;
          groupBy: 'month' | 'day';
      }
    | {
          label: 'all';
          weeks: null;
          groupBy: 'month' | 'day';
      };

export type GraphTicksInterval = 'month' | 'day' | '2-day';
interface CommonAggregatedHistory {
    time: number;
    txs: number;
    sentFiat: { [k: string]: string | undefined };
    receivedFiat: { [k: string]: string | undefined };
}
export interface AggregatedAccountHistory extends CommonAggregatedHistory {
    sent: string;
    received: string;
}
export interface AggregatedDashboardHistory extends CommonAggregatedHistory {
    sent?: never;
    received?: never;
}
