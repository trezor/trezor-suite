import {
    GraphRange,
    AggregatedAccountHistory,
    AggregatedDashboardHistory,
} from '@wallet-types/graph';
import { Account } from '@wallet-types';

interface CommonProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    localCurrency: string;
    minMaxValues: [number, number];
    hideToolbar?: boolean;
    onRefresh?: () => void;
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
    receivedValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    sentValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    balanceValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    account?: never;
}

export type Props = CryptoGraphProps | FiatGraphProps;
