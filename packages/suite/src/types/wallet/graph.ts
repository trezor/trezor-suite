import { NetworkSymbol } from '@suite-common/wallet-config';
import { BlockchainAccountBalanceHistory, StaticSessionId } from '@trezor/connect';

export interface AccountHistoryWithBalance extends BlockchainAccountBalanceHistory {
    balance: string;
}

export interface AccountIdentifier {
    descriptor: string;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
}

export interface GraphData {
    account: AccountIdentifier;
    error: boolean;
    isLoading: boolean;
    data: AccountHistoryWithBalance[];
}

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

export type GraphScale = 'linear' | 'log';

export type AggregatedDashboardHistory = CommonAggregatedHistory;

export interface AggregatedAccountHistory extends CommonAggregatedHistory {
    balance: string;
    sent: string;
    received: string;
}
