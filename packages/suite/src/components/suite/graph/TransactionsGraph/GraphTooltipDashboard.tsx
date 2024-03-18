import { TooltipProps } from 'recharts';

import { useFormatters } from '@suite-common/formatters';

import { CommonAggregatedHistory, GraphRange } from 'src/types/wallet/graph';

import type { FiatGraphProps } from './TransactionsGraph';
import { GraphTooltipBase } from './GraphTooltipBase';

interface GraphTooltipDashboardProps extends TooltipProps<number, any> {
    selectedRange: GraphRange;
    localCurrency: string;
    sentValueFn: FiatGraphProps['sentValueFn'];
    receivedValueFn: FiatGraphProps['receivedValueFn'];
    balanceValueFn?: FiatGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

export const GraphTooltipDashboard = ({
    active,
    localCurrency,
    payload,
    receivedValueFn,
    sentValueFn,
    ...props
}: GraphTooltipDashboardProps) => {
    const { FiatAmountFormatter } = useFormatters();

    // Note: payload is [] when discovery is paused.
    if (!active || !payload?.length) {
        return null;
    }

    const receivedAmountString = receivedValueFn(payload[0].payload);
    const sentAmountString = sentValueFn(payload[0].payload);

    const receivedAmount = (
        <FiatAmountFormatter currency={localCurrency} value={receivedAmountString ?? '0'} />
    );

    const sentAmount = (
        <FiatAmountFormatter currency={localCurrency} value={sentAmountString ?? '0'} />
    );

    return (
        <GraphTooltipBase
            {...props}
            active={active}
            payload={payload}
            sentAmount={sentAmount}
            receivedAmount={receivedAmount}
        />
    );
};
