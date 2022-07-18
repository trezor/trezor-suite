import React from 'react';
import styled from 'styled-components';
import { TooltipProps } from 'recharts';
import { FormattedFiatAmount } from '@suite-components';
import { FormattedCryptoAmount } from '@suite-components/FormattedCryptoAmount';
import { NetworkSymbol } from '@wallet-types';
import { CommonAggregatedHistory } from '@wallet-types/graph';
import { Props as GraphProps, CryptoGraphProps } from '../../definitions';
import { CustomTooltipBase } from '../CustomTooltipBase';

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    margin-right: 2px;
`;

const formatAmount = (
    amount: string | undefined,
    symbol: NetworkSymbol,
    fiatAmount: string | undefined,
    localCurrency: string | undefined,
    sign: 'pos' | 'neg',
) => (
    <>
        {amount && (
            <StyledCryptoAmount
                value={amount}
                symbol={symbol}
                signValue={sign}
                disableHiddenPlaceholder
            />
        )}

        {fiatAmount && localCurrency && (
            <>
                (
                <FormattedFiatAmount currency={localCurrency} value={fiatAmount} />)
            </>
        )}
    </>
);

interface CustomTooltipAccountProps extends TooltipProps<number, any> {
    selectedRange: GraphProps['selectedRange'];
    localCurrency: string;
    symbol: NetworkSymbol;
    sentValueFn: CryptoGraphProps['sentValueFn'];
    receivedValueFn: CryptoGraphProps['receivedValueFn'];
    balanceValueFn: CryptoGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

export const CustomTooltipAccount = (props: CustomTooltipAccountProps) => {
    if (!props.active || !props.payload) {
        return null;
    }

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
                'neg',
            )}
            receivedAmount={formatAmount(
                receivedAmountString,
                props.symbol,
                receivedFiat,
                props.localCurrency,
                'pos',
            )}
            balance={
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={balance as string}
                    symbol={props.symbol}
                />
            }
            onShow={props.onShow}
            extendedDataForInterval={props.extendedDataForInterval}
        />
    );
};
