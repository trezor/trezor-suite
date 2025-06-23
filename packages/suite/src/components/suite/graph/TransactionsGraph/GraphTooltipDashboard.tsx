import { DefaultTooltipContentProps } from 'recharts';

import { useFormatters } from '@suite-common/formatters';

import { CommonAggregatedHistory, GraphRange } from 'src/types/wallet/graph';

import { GraphTooltipBase } from './GraphTooltipBase';
import type { FiatGraphProps } from './LegacyTransactionsGraph';

interface GraphTooltipDashboardProps {
    active?: boolean;
    payload?: DefaultTooltipContentProps<number, string>['payload'];
    label?: string | number;
    coordinate?: { x?: number; y?: number };
    chartWidth: number; // ← vstup z parent komponenty
    selectedRange: GraphRange;
    localCurrency: string;
    sentValueFn: FiatGraphProps['sentValueFn'];
    receivedValueFn: FiatGraphProps['receivedValueFn'];
    balanceValueFn?: FiatGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

export const GraphTooltipDashboard = (props: GraphTooltipDashboardProps) => {
    const {
        active,
        payload,
        coordinate,
        chartWidth,
        localCurrency,
        receivedValueFn,
        sentValueFn,
        ...rest
    } = props;

    const { FiatAmountFormatter } = useFormatters();

    if (!active || !payload?.length) {
        return null;
    }

    const dataPoint = payload[0].payload;
    const receivedAmountString = receivedValueFn(dataPoint);
    const sentAmountString = sentValueFn(dataPoint);

    const receivedAmount = (
        <FiatAmountFormatter currency={localCurrency} value={receivedAmountString ?? '0'} />
    );

    const sentAmount = (
        <FiatAmountFormatter currency={localCurrency} value={sentAmountString ?? '0'} />
    );

    return (
        <GraphTooltipBase
            {...rest}
            active={active}
            payload={payload}
            coordinate={coordinate}
            chartWidth={chartWidth}
            sentAmount={sentAmount}
            receivedAmount={receivedAmount}
        />
    );
};
