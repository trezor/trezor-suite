import { type ReactNode } from 'react';
import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AnimatedView, BannerInline, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { CustomFeeInputs } from './CustomFeeInputs';

type CustomFeeContentProps = {
    symbol: NetworkSymbol;
    feeValue: string | null;
    isFeeLoading: boolean;
    errorMessage: ReactNode;
};

export const CustomFeeContent = ({
    symbol,
    feeValue,
    isFeeLoading,
    errorMessage,
}: CustomFeeContentProps) => (
    <VStack marginTop="sp24" spacing="sp24" justifyContent="space-between" flex={1}>
        <CustomFeeInputs symbol={symbol} />
        <HStack flex={1} justifyContent="space-between" alignItems="center" paddingHorizontal="sp1">
            <Text variant="body-md-strong">
                <Translation id="transactionManagement.fees.custom.bottomSheet.total" />
            </Text>
            {feeValue === null && !isFeeLoading ? (
                <Text color="contentSecondary">
                    <Translation id="transactionManagement.fees.levelUnavailable" />
                </Text>
            ) : (
                <VStack alignItems="flex-end">
                    <CryptoToFiatAmountFormatter
                        value={feeValue}
                        isLoading={isFeeLoading}
                        symbol={symbol}
                        isDiscreetText={false}
                    />
                    <ExactCryptoAmountFormatter
                        value={feeValue}
                        symbol={symbol}
                        variant="body-md"
                        isLoading={isFeeLoading}
                        isBalance={false}
                        isDiscreetText={false}
                    />
                </VStack>
            )}
        </HStack>
        {errorMessage && (
            <AnimatedView entering={FadeInDown} exiting={FadeOutDown}>
                <BannerInline intent="critical" title={errorMessage} />
            </AnimatedView>
        )}
    </VStack>
);
