import { useSelector } from 'react-redux';

import { type SlippageFormValues, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { useFormContext, useWatch } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useFormatCryptoValue } from '@suite-native/trading-atoms';
import { BigNumber } from '@trezor/utils';

type SlippageSummaryProps = {
    receiveAmount: string;
};

export const SlippageSummary = ({ receiveAmount }: SlippageSummaryProps) => {
    const { control, formState } = useFormContext<SlippageFormValues>();
    const formatCryptoValue = useFormatCryptoValue();
    const { receive, swapSlippage } = useSelector(selectTradingExchangeSelectedQuote) ?? {};

    const slippageValue = useWatch({ control, name: 'slippage' });

    if (swapSlippage === undefined) {
        throw new Error('swapSlippage is required in quote for SlippageSummary');
    }

    const previewSlippage =
        !formState.errors.slippage && slippageValue !== ''
            ? BigNumber(slippageValue)
            : BigNumber(swapSlippage);

    const receiveAmountBigNumber = BigNumber(receiveAmount);
    const slippageDeduction = previewSlippage
        .dividedBy(100)
        .multipliedBy(receiveAmountBigNumber)
        .negated();
    const minimumReceive = receiveAmountBigNumber.plus(slippageDeduction);

    return (
        <VStack spacing="sp12">
            <HStack justifyContent="space-between">
                <Text variant="body-md" color="contentSecondary">
                    <Translation id="moduleTrading.slippage.summary.offered" />
                </Text>
                <Text variant="body-md">{formatCryptoValue(receiveAmount, receive)}</Text>
            </HStack>
            <HStack justifyContent="space-between">
                <Text variant="body-md" color="contentSecondary">
                    <Translation id="moduleTrading.slippage.summary.deduction" />
                </Text>
                <Text variant="body-md">
                    {formatCryptoValue(String(slippageDeduction), receive)}
                </Text>
            </HStack>
            <Divider />
            <HStack justifyContent="space-between">
                <Text variant="body-md-strong" color="contentSecondary">
                    <Translation id="moduleTrading.slippage.summary.minimum" />
                </Text>
                <Text variant="body-md-strong">
                    {formatCryptoValue(String(minimumReceive), receive)}
                </Text>
            </HStack>
        </VStack>
    );
};
