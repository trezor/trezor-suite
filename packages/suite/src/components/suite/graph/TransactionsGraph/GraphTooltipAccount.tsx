import { TooltipProps } from 'recharts';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Formatters, useFormatters } from '@suite-common/formatters';
import { SignOperator } from '@suite-common/suite-types';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { CommonAggregatedHistory, GraphRange } from 'src/types/wallet/graph';

import type { CryptoGraphProps } from './TransactionsGraph';
import { GraphTooltipBase } from './GraphTooltipBase';

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
        <Row>
            {amount && (
                <Row margin={{ right: spacings.xxs }}>
                    <FormattedCryptoAmount
                        value={amount}
                        symbol={symbol}
                        signValue={sign}
                        disableHiddenPlaceholder
                    />
                </Row>
            )}

            {fiatAmount && localCurrency && (
                <>
                    (
                    <FiatAmountFormatter currency={localCurrency} value={fiatAmount} />)
                </>
            )}
        </Row>
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

    // Note: payload is [] when discovery is paused.
    if (!active || !payload?.length) {
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
