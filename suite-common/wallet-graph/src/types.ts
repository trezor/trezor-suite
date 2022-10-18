import { BlockchainAccountBalanceHistory } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountBalanceHistory } from '@trezor/blockchain-link/libDev/src';

export interface AccountHistoryWithBalance extends BlockchainAccountBalanceHistory {
    balance: string;
}

export type GraphRange =
    | {
          label: 'day' | 'week' | 'month' | 'year' | 'range';
          startDate: Date;
          endDate: Date;
          groupBy: 'month' | 'day';
      }
    | {
          label: 'all';
          startDate: null;
          endDate: null;
          groupBy: 'month' | 'day';
      };

export type GraphTicksInterval = 'month' | 'day' | '2-day';
export interface CommonAggregatedHistory {
    time: number;
    txs: number;
    sent: string | undefined;
    received: string | undefined;
    balance: string | undefined;
    balanceFiat: { [k: string]: string | undefined };
    sentFiat: { [k: string]: string | undefined };
    receivedFiat: { [k: string]: string | undefined };
}
// export interface AggregatedAccountHistory extends CommonAggregatedHistory {
//     sent: string;
//     received: string;
// }
// export interface AggregatedDashboardHistory extends CommonAggregatedHistory {
//     sent?: never;
//     received?: never;
// }
export interface AggregatedAccountHistory extends CommonAggregatedHistory {
    balance: string;
    sent: string;
    received: string;
}
export type AggregatedDashboardHistory = CommonAggregatedHistory;

export type GraphScale = 'linear' | 'log';

export interface AccountIdentifier {
    descriptor: string;
    deviceState: string;
    symbol: NetworkSymbol;
}

export interface GraphData {
    account: AccountIdentifier;
    error: boolean;
    isLoading: boolean;
    data: AccountHistoryWithBalance[];
}

export interface LineGraphPoint {
    value: number;
    date: Date;
}

export type LineGraphTimeFrameValues = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

type LineGraphTimeFrameItem = {
    shortcut: string;
    value: LineGraphTimeFrameValues;
    stepInMinutes?: number;
    valueBackInMinutes?: number;
};

export type LineGraphTimeFrameItems = Record<LineGraphTimeFrameValues, LineGraphTimeFrameItem>;

export interface EnhancedAccountBalanceHistory extends AccountBalanceHistory {
    balance?: string;
}
