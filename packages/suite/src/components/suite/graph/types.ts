import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

import { type Account } from 'src/types/wallet';
import {
    type AggregatedAccountHistory,
    type AggregatedDashboardHistory,
    type GraphRange,
} from 'src/types/wallet/graph';

export interface CommonGraphProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    localCurrency: string;
    minMaxValues: [number, number];
    hideToolbar?: boolean;
    onRefresh?: (abortController?: AbortController) => Promise<unknown>;
}

export interface CryptoGraphProps extends CommonGraphProps {
    variant: 'one-asset';
    account: Account;
    data: AggregatedAccountHistory[];
    receivedValueFn: (data: AggregatedAccountHistory) => string | undefined;
    sentValueFn: (data: AggregatedAccountHistory) => string | undefined;
    balanceValueFn: (data: AggregatedAccountHistory) => string | undefined;
}

export interface FiatGraphProps extends CommonGraphProps {
    variant: 'all-assets';
    data: AggregatedDashboardHistory[];
    receivedValueFn: (data: AggregatedDashboardHistory) => BaseCurrencyAmount | undefined;
    sentValueFn: (data: AggregatedDashboardHistory) => BaseCurrencyAmount | undefined;
    balanceValueFn: (data: AggregatedDashboardHistory) => BaseCurrencyAmount | undefined;
    account?: never;
}

export type TransactionsGraphProps = CryptoGraphProps | FiatGraphProps;
