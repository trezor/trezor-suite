import type { ExchangeTrade } from 'invity-api';

import { type SlippageFormValues } from '@suite-common/trading';
import { Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useFormatCryptoValue } from '@suite-native/trading-atoms';
import type { MaxSlippageFormValues } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

type SlippageSummaryProps = {
    quote: ExchangeTrade;
};

export const SlippageSummary = ({ quote }: SlippageSummaryProps) => {
    const { watch, formState } = useFormContext<SlippageFormValues>();
    const formatCryptoValue = useFormatCryptoValue();

    const { receive, receiveStringAmount, swapSlippage } = quote;
    const slippageValue = watch('slippage');

    if (swapSlippage === undefined) {
        throw new Error('swapSlippage is required in quote for SlippageSummary');
    }

    if (receiveStringAmount === undefined) {
        throw new Error('receiveStringAmount is required in quote for SlippageSummary');
    }

    const previewSlippage =
        !formState.errors.slippage && slippageValue !== ''
            ? BigNumber(slippageValue)
            : BigNumber(quote.swapSlippage);

    const receiveAmount = BigNumber(receiveStringAmount);
    const slippageDeduction = previewSlippage.dividedBy(100).multipliedBy(receiveAmount).negated();
    const minimumReceive = receiveAmount.plus(slippageDeduction);

    return (
        <VStack spacing="sp12">
            <HStack justifyContent="space-between">
                <Text variant="body-md" color="contentSecondary">
                    <Translation id="moduleTrading.slippage.summary.offered" />
                </Text>
                <Text variant="body-md">{formatCryptoValue(receiveStringAmount, receive)}</Text>
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
