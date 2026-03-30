import { FadeIn, FadeOut } from 'react-native-reanimated';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { AnimatedPressable, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useNativeStyles } from '@trezor/styles-native';

import { FeeLabelTranslation } from './FeeLabelTranslation';

export type FeeSummaryCardProps = {
    fee: string | null;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    areFeesLoading: boolean;
    onPress?: () => void;
    testID?: string;
    withCaret?: boolean;
};

export const FeeSummaryCard = ({
    fee,
    symbol,
    networkType,
    areFeesLoading,
    onPress,
    testID,
    withCaret,
}: FeeSummaryCardProps) => {
    const {
        utils: { spacings },
    } = useNativeStyles();

    return (
        <AnimatedPressable exiting={FadeOut} entering={FadeIn} onPress={onPress} testID={testID}>
            <Card style={{ paddingVertical: spacings.sp12 }}>
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack spacing="sp4">
                        <Text variant="body-sm">
                            <FeeLabelTranslation networkType={networkType} />
                        </Text>
                    </VStack>
                    <HStack alignItems="center" spacing="sp8">
                        <VStack alignItems="flex-end" spacing="sp2">
                            <CryptoAmountFormatter
                                variant="body-sm"
                                color="contentPrimary"
                                value={fee}
                                symbol={symbol}
                                isBalance={false}
                                isLoading={areFeesLoading}
                                isDiscreetText={false}
                                testID="@transactionManagement/fee-crypto-amount"
                            />
                            <CryptoToFiatAmountFormatter
                                variant="body-sm"
                                color="contentSecondary"
                                value={fee}
                                symbol={symbol}
                                isLoading={areFeesLoading}
                                isDiscreetText={false}
                            />
                        </VStack>
                        {!!withCaret && <Icon name="caretDown" size="medium" color="contentSecondary" />}
                    </HStack>
                </HStack>
            </Card>
        </AnimatedPressable>
    );
};
