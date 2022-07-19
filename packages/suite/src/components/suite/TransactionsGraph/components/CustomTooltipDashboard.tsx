import React from 'react';
import { FormattedFiatAmount } from '@suite-components';
import { TooltipProps } from 'recharts';
import { CommonAggregatedHistory } from '@wallet-types/graph';
import { Props as GraphProps, FiatGraphProps } from '../definitions';
import { CustomTooltipBase } from './CustomTooltipBase';

interface CustomTooltipDashboardProps extends TooltipProps<number, any> {
    selectedRange: GraphProps['selectedRange'];
    localCurrency: string;
    sentValueFn: FiatGraphProps['sentValueFn'];
    receivedValueFn: FiatGraphProps['receivedValueFn'];
    balanceValueFn?: FiatGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

export const CustomTooltipDashboard = (props: CustomTooltipDashboardProps) => {
    if (!props.active || !props.payload) {
        return null;
    }

    const receivedAmountString = props.receivedValueFn(props.payload[0].payload);
    const sentAmountString = props.sentValueFn(props.payload[0].payload);

    const receivedAmount = (
        <FormattedFiatAmount currency={props.localCurrency} value={receivedAmountString ?? '0'} />
    );

    const sentAmount = (
        <FormattedFiatAmount currency={props.localCurrency} value={sentAmountString ?? '0'} />
    );

    return (
        <CustomTooltipBase
            {...props}
            selectedRange={props.selectedRange}
            sentAmount={sentAmount}
            receivedAmount={receivedAmount}
            onShow={props.onShow}
            extendedDataForInterval={props.extendedDataForInterval}
        />
    );
};
