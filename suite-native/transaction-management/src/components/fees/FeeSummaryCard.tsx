import { FadeIn, FadeOut } from 'react-native-reanimated';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { AnimatedPressable, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';

import { FeeLabelTranslation } from './FeeLabelTranslation';

export type FeeSummaryCardProps = {
    fee: string;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    areFeesLoading: boolean;
    onPress: () => void;
    testID?: string;
};

export const FeeSummaryCard = ({
    fee,
    symbol,
    networkType,
    areFeesLoading,
    onPress,
    testID,
}: FeeSummaryCardProps) => (
    <AnimatedPressable exiting={FadeOut} entering={FadeIn} onPress={onPress} testID={testID}>
        <Card>
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
                            color="textDefault"
                            value={fee}
                            symbol={symbol}
                            isBalance={false}
                            isLoading={areFeesLoading}
                            isDiscreetText={false}
                            testID="@transactionManagement/fee-crypto-amount"
                        />
                        <CryptoToFiatAmountFormatter
                            variant="body-sm"
                            color="textSubdued"
                            value={fee}
                            symbol={symbol}
                            isLoading={areFeesLoading}
                            isDiscreetText={false}
                        />
                    </VStack>
                    <Icon name="caretDown" size="medium" color="iconSubdued" />
                </HStack>
            </HStack>
        </Card>
    </AnimatedPressable>
);
