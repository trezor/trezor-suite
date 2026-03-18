import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

import { getFeeLabelTranslationId } from './feesLabelUtils';

type FeeSummaryCardProps = {
    // Step 1: fee always shows the `normal` fee level. Step 6 will show the selected fee level.
    fee: string;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    areFeesLoading: boolean;
    // Step 1: no-op. Step 6 wires this to open FeesBottomSheet.
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
}: FeeSummaryCardProps) => {
    const { translate } = useTranslate();
    const labelKey = getFeeLabelTranslationId(networkType);

    return (
        <PressableOpacity onPress={onPress} testID={testID}>
            <Card>
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack spacing="sp4">
                        <Text variant="body-sm-strong">{translate(labelKey)}</Text>
                    </VStack>
                    <HStack alignItems="center" spacing="sp8">
                        <VStack alignItems="flex-end" spacing="sp2">
                            <CryptoAmountFormatter
                                variant="body-sm-strong"
                                color="textDefault"
                                value={fee}
                                symbol={symbol}
                                isBalance={false}
                                isLoading={areFeesLoading}
                            />
                            <CryptoToFiatAmountFormatter
                                variant="body-xs"
                                color="textSubdued"
                                value={fee}
                                symbol={symbol}
                                isLoading={areFeesLoading}
                            />
                        </VStack>
                        <Icon name="caretDown" size="medium" color="iconSubdued" />
                    </HStack>
                </HStack>
            </Card>
        </PressableOpacity>
    );
};
