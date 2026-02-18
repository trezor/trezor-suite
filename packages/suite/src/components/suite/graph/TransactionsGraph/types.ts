import type { BaseCurrencyAmount } from '@suite-common/wallet-types';

import type { Account } from 'src/types/wallet';
import type {
    AggregatedAccountHistory,
    AggregatedDashboardHistory,
    GraphRange,
} from 'src/types/wallet/graph';

interface CommonProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    localCurrency: string;
    minMaxValues: [number, number];
    hideToolbar?: boolean;
    onRefresh?: (abortController?: AbortController) => Promise<any>;
}

export interface CryptoGraphProps extends CommonProps {
    variant: 'one-asset';
    account: Account;
    data: AggregatedAccountHistory[];
    receivedValueFn: (data: AggregatedAccountHistory) => string | undefined;
    sentValueFn: (data: AggregatedAccountHistory) => string | undefined;
    balanceValueFn: (data: AggregatedAccountHistory) => string | undefined;
}

export interface FiatGraphProps extends CommonProps {
    variant: 'all-assets';
    data: AggregatedDashboardHistory[];
    receivedValueFn: (data: AggregatedDashboardHistory) => BaseCurrencyAmount | undefined;
    sentValueFn: (data: AggregatedDashboardHistory) => BaseCurrencyAmount | undefined;
    balanceValueFn: (data: AggregatedDashboardHistory) => BaseCurrencyAmount | undefined;
    account?: never;
}

export type TransactionsGraphProps = CryptoGraphProps | FiatGraphProps;
