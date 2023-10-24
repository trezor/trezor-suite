import styled from 'styled-components';
import { TooltipProps } from 'recharts';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { NetworkSymbol } from 'src/types/wallet';

import { Formatters, useFormatters } from '@suite-common/formatters';

import type { CryptoGraphProps } from './TransactionsGraph';
import { GraphTooltipBase } from './GraphTooltipBase';
import { CommonAggregatedHistory, GraphRange } from 'src/types/wallet/graph';
import { SignOperator } from '@suite-common/suite-types';

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    margin-right: 2px;
`;

const formatAmount = (
    amount: string | undefined,
    symbol: NetworkSymbol,
    fiatAmount: string | undefined,
    localCurrency: string | undefined,
    sign: SignOperator,
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

interface GraphTooltipAccountProps extends TooltipProps<number, any> {
    selectedRange: GraphRange;
    localCurrency: string;
    symbol: NetworkSymbol;
    sentValueFn: CryptoGraphProps['sentValueFn'];
    receivedValueFn: CryptoGraphProps['receivedValueFn'];
    balanceValueFn: CryptoGraphProps['balanceValueFn'];
    onShow?: (index: number) => void;
    extendedDataForInterval?: CommonAggregatedHistory[];
}

export const GraphTooltipAccount = ({
    active,
    balanceValueFn,
    receivedValueFn,
    sentValueFn,
    payload,
    localCurrency,
    symbol,
    ...props
}: GraphTooltipAccountProps) => {
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
        <GraphTooltipBase
            {...props}
            active={active}
            payload={payload}
            sentAmount={formatAmount(
                sentAmountString,
                symbol,
                sentFiat,
                localCurrency,
                'negative',
                formatters,
            )}
            receivedAmount={formatAmount(
                receivedAmountString,
                symbol,
                receivedFiat,
                localCurrency,
                'positive',
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
