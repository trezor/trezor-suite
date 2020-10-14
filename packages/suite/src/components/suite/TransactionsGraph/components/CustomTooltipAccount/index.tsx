import React from 'react';
import { TooltipProps } from 'recharts';
import { FormattedNumber, FormattedCryptoAmount } from '@suite-components';
import { Account } from '@wallet-types';
import { CommonAggregatedHistory } from '@wallet-types/graph';
import { Props as GraphProps, CryptoGraphProps } from '../../index';
import CustomTooltipBase from '../CustomTooltipBase';

interface Props extends TooltipProps {
    selectedRange: GraphProps['selectedRange'];
    localCurrency: string;
    symbol: Account['symbol'];
    sentValueFn: CryptoGraphProps['sentValueFn'];
    receivedValueFn: CryptoGraphProps['receivedValueFn'];
    balanceValueFn: CryptoGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

const formatAmount = (
    amount: string | undefined,
    symbol: string,
    fiatAmount?: string,
    localCurrency?: string,
) => (
    <>
        {amount} {symbol.toUpperCase()}
        {fiatAmount && localCurrency && (
            <>
                {' '}
                (
                <FormattedNumber currency={localCurrency} value={fiatAmount} />)
            </>
        )}
    </>
);

const CustomTooltipAccount = (props: Props) => {
    if (props.active && props.payload) {
        const balance = props.balanceValueFn(props.payload[0].payload);
        const receivedAmountString = props.receivedValueFn(props.payload[0].payload);
        const sentAmountString = props.sentValueFn(props.payload[0].payload);

        const receivedFiat: string | undefined =
            props.payload[0].payload.receivedFiat[props.localCurrency] ?? undefined;
        const sentFiat: string | undefined =
            props.payload[0].payload.sentFiat[props.localCurrency] ?? undefined;

        return (
            <CustomTooltipBase
                {...props}
                selectedRange={props.selectedRange}
                sentAmount={formatAmount(
                    sentAmountString,
                    props.symbol,
                    sentFiat,
                    props.localCurrency,
                )}
                receivedAmount={formatAmount(
                    receivedAmountString,
                    props.symbol,
                    receivedFiat,
                    props.localCurrency,
                )}
                balance={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={balance}
                        symbol={props.symbol}
                    />
                }
            />
        );
    }

    return null;
};

export default CustomTooltipAccount;
