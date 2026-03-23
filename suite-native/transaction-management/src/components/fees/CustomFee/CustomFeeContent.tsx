import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { CustomFeeInputs } from './CustomFeeInputs';

type CustomFeeContentProps = {
    symbol: NetworkSymbol;
    feeValue: string;
    isFeeLoading: boolean;
    isErrorBoxVisible: boolean;
};

export const CustomFeeContent = ({
    symbol,
    feeValue,
    isFeeLoading,
    isErrorBoxVisible,
}: CustomFeeContentProps) => (
    <VStack marginTop="sp24" spacing="sp24" justifyContent="space-between" flex={1}>
        <CustomFeeInputs symbol={symbol} />
        <HStack flex={1} justifyContent="space-between" alignItems="center" paddingHorizontal="sp1">
            <Text variant="body-md-strong">
                <Translation id="transactionManagement.fees.custom.bottomSheet.total" />
            </Text>
            <VStack alignItems="flex-end">
                <CryptoToFiatAmountFormatter
                    value={feeValue}
                    isLoading={isFeeLoading}
                    symbol={symbol}
                    isDiscreetText={false}
                />
                <CryptoAmountFormatter
                    value={feeValue}
                    symbol={symbol}
                    variant="body-md"
                    isLoading={isFeeLoading}
                    isBalance={false}
                    isDiscreetText={false}
                />
            </VStack>
        </HStack>
        {isErrorBoxVisible && (
            <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                <InlineAlertBox
                    variant="critical"
                    title={<Translation id="transactionManagement.fees.error" />}
                />
            </Animated.View>
        )}
    </VStack>
);
