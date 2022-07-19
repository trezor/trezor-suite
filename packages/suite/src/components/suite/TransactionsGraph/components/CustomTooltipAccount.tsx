import React from 'react';
import styled from 'styled-components';
import { TooltipProps } from 'recharts';
import { FormattedFiatAmount } from '@suite-components';
import { FormattedCryptoAmount } from '@suite-components/FormattedCryptoAmount';
import { NetworkSymbol } from '@wallet-types';
import { CommonAggregatedHistory } from '@wallet-types/graph';
import { Props as GraphProps, CryptoGraphProps } from '../definitions';
import { CustomTooltipBase } from './CustomTooltipBase';

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

export const CustomTooltipAccount = ({
    active,
    balanceValueFn,
    receivedValueFn,
    sentValueFn,
    payload,
    localCurrency,
    symbol,
    ...props
}: CustomTooltipAccountProps) => {
    if (!active || !payload) {
        return null;
    }

    const balance = balanceValueFn(payload[0].payload);
    const receivedAmountString = receivedValueFn(payload[0].payload);
    const sentAmountString = sentValueFn(payload[0].payload);

    const receivedFiat: string | undefined =
        payload[0].payload.receivedFiat[localCurrency] ?? undefined;
    const sentFiat: string | undefined = payload[0].payload.sentFiat[localCurrency] ?? undefined;

    return (
        <CustomTooltipBase
            {...props}
            sentAmount={formatAmount(sentAmountString, symbol, sentFiat, localCurrency, 'neg')}
            receivedAmount={formatAmount(
                receivedAmountString,
                symbol,
                receivedFiat,
                localCurrency,
                'pos',
            )}
            balance={
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={balance as string}
                    symbol={symbol}
                />
            }
        />
    );
};
