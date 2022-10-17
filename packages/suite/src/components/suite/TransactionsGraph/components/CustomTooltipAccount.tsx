import React from 'react';

import styled from 'styled-components';
import { TooltipProps } from 'recharts';
import { FormattedCryptoAmount } from '@suite-components/FormattedCryptoAmount';
import { NetworkSymbol } from '@wallet-types';

import { Formatters, useFormatters } from '@suite-common/formatters';
import { CommonAggregatedHistory } from '@suite-common/wallet-graph';

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
    formatters: Formatters,
) => {
    const { FiatAmountFormatter } = formatters;

    return (
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
                    <FiatAmountFormatter currency={localCurrency} value={fiatAmount} />)
                </>
            )}
        </>
    );
};

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
    const formatters = useFormatters();
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
            active={active}
            payload={payload}
            sentAmount={formatAmount(
                sentAmountString,
                symbol,
                sentFiat,
                localCurrency,
                'neg',
                formatters,
            )}
            receivedAmount={formatAmount(
                receivedAmountString,
                symbol,
                receivedFiat,
                localCurrency,
                'pos',
                formatters,
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
