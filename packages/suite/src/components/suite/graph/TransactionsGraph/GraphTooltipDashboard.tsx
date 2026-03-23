import { type TooltipProps } from 'recharts';

import { useFormatters } from '@suite-common/formatters';
import { BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';

import type { FiatGraphProps } from 'src/components/suite/graph/types';
import { type CommonAggregatedHistory, type GraphRange } from 'src/types/wallet/graph';

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
    const { BaseCurrencyAmountFormatter } = useFormatters();

    // Note: payload is [] when discovery is paused.
    if (!active || !payload?.length) {
        return null;
    }

    const receivedAmountString = receivedValueFn(payload[0].payload);
    const sentAmountString = sentValueFn(payload[0].payload);

    const receivedAmount = (
        <BaseCurrencyAmountFormatter
            currency={localCurrency}
            value={receivedAmountString ?? BASE_CURRENCY_ZERO}
        />
    );

    const sentAmount = (
        <BaseCurrencyAmountFormatter
            currency={localCurrency}
            value={sentAmountString ?? BASE_CURRENCY_ZERO}
        />
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
