import React from 'react';
import { FormattedNumber } from '@suite-components';
import { TooltipProps } from 'recharts';
import { Props as GraphProps, FiatGraphProps } from '../../index';
import CustomTooltipBase from '../CustomTooltipBase';

interface Props extends TooltipProps {
    selectedRange: GraphProps['selectedRange'];
    localCurrency: string;
    sentValueFn: FiatGraphProps['sentValueFn'];
    receivedValueFn: FiatGraphProps['receivedValueFn'];
}

const CustomTooltipDashboard = (props: Props) => {
    if (props.active && props.payload) {
        const receivedAmountString = props.receivedValueFn(props.payload[0].payload);
        const sentAmountString = props.sentValueFn(props.payload[0].payload);

        const receivedAmount = (
            <FormattedNumber currency={props.localCurrency} value={receivedAmountString ?? '0'} />
        );
        const sentAmount = (
            <FormattedNumber currency={props.localCurrency} value={sentAmountString ?? '0'} />
        );

        return (
            <CustomTooltipBase
                {...props}
                selectedRange={props.selectedRange}
                sentAmount={sentAmount}
                receivedAmount={receivedAmount}
            />
        );
    }

    return null;
};

export default CustomTooltipDashboard;
