import React from 'react';
import { FormattedNumber } from '@suite-components';
import { TooltipProps } from 'recharts';
import { CommonAggregatedHistory } from '@wallet-types/graph';
import { Props as GraphProps, FiatGraphProps } from '../../index';
import CustomTooltipBase from '../CustomTooltipBase';

interface Props extends TooltipProps {
    selectedRange: GraphProps['selectedRange'];
    localCurrency: string;
    sentValueFn: FiatGraphProps['sentValueFn'];
    receivedValueFn: FiatGraphProps['receivedValueFn'];
    balanceValueFn?: FiatGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

const CustomTooltipDashboard = (props: Props) => {
    if (props.active && props.payload) {
        const receivedAmountString = props.receivedValueFn(props.payload[0].payload);
        const sentAmountString = props.sentValueFn(props.payload[0].payload);
        // const balanceString = props.balanceValueFn(props.payload[0].payload);

        const receivedAmount = (
            <FormattedNumber currency={props.localCurrency} value={receivedAmountString ?? '0'} />
        );

        const sentAmount = (
            <FormattedNumber currency={props.localCurrency} value={sentAmountString ?? '0'} />
        );

        // const balanceAmount = (
        //     <FormattedNumber currency={props.localCurrency} value={balanceString ?? '0'} />
        // );

        return (
            <CustomTooltipBase
                {...props}
                selectedRange={props.selectedRange}
                sentAmount={sentAmount}
                receivedAmount={receivedAmount}
                // balance={balanceAmount}
            />
        );
    }

    return null;
};

export default CustomTooltipDashboard;
