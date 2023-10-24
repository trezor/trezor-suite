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

export const GraphTooltipDashboard = (props: GraphTooltipDashboardProps) => {
    const { FiatAmountFormatter } = useFormatters();

    if (!props.active || !props.payload) {
        return null;
    }

    const receivedAmountString = props.receivedValueFn(props.payload[0].payload);
    const sentAmountString = props.sentValueFn(props.payload[0].payload);

    const receivedAmount = (
        <FiatAmountFormatter currency={props.localCurrency} value={receivedAmountString ?? '0'} />
    );

    const sentAmount = (
        <FiatAmountFormatter currency={props.localCurrency} value={sentAmountString ?? '0'} />
    );

    return (
        <GraphTooltipBase
            {...props}
            selectedRange={props.selectedRange}
            sentAmount={sentAmount}
            receivedAmount={receivedAmount}
            onShow={props.onShow}
            extendedDataForInterval={props.extendedDataForInterval}
        />
    );
};
