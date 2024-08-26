import { NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, VStack, Text } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { TxKeyPath, Translation } from '@suite-native/intl';

export const ReviewOutputItemValues = ({
    networkSymbol,
    value,
    translationKey,
}: {
    networkSymbol: NetworkSymbol;
    value: string;
    translationKey: TxKeyPath;
}) => {
    return (
        <HStack>
            <VStack flex={0.55} justifyContent="center" spacing="extraSmall">
                <Text variant="callout">
                    <Translation id={translationKey} />
                </Text>
            </VStack>
            <VStack flex={0.45} alignItems="flex-end" spacing="extraSmall">
                <CryptoToFiatAmountFormatter
                    variant="hint"
                    color="textDefault"
                    value={value}
                    network={networkSymbol}
                    isBalance={false}
                />
                <CryptoAmountFormatter
                    variant="hint"
                    color="textSubdued"
                    value={value}
                    network={networkSymbol}
                    isBalance={false}
                />
            </VStack>
        </HStack>
    );
};
