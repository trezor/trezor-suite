import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { type BlockchainAccountBalanceHistory, type StaticSessionId } from '@trezor/connect';

export interface AccountHistoryWithBalance extends BlockchainAccountBalanceHistory {
    balance: string;
}

export interface AccountIdentifier {
    descriptor: AccountDescriptor;
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
    balanceFiat: { [k: string]: BaseCurrencyAmount | undefined };
    sentFiat: { [k: string]: BaseCurrencyAmount | undefined };
    receivedFiat: { [k: string]: BaseCurrencyAmount | undefined };
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
