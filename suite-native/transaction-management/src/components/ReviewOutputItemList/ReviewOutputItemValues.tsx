import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CoinAmountFormatter, CoinToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';

export type ReviewOutputItemValuesProps = {
    accountKey: AccountKey;
    value: string;
    translationKey: TxKeyPath;
    tokenContract?: TokenAddress;
    isCryptoPrimary?: boolean;
};

export const ReviewOutputItemValues = ({
    accountKey,
    value,
    translationKey,
    tokenContract,
    isCryptoPrimary = false,
}: ReviewOutputItemValuesProps) => {
    const fiatFormatter = (
        <CoinToFiatAmountFormatter
            variant="body-sm"
            color={isCryptoPrimary ? 'textSubdued' : 'textDefault'}
            value={value}
            accountKey={accountKey}
            tokenContract={tokenContract}
            adjustsFontSizeToFit
            numberOfLines={1}
            isDiscreetText={false}
        />
    );

    const cryptoFormatter = (
        <CoinAmountFormatter
            variant="body-sm"
            color={isCryptoPrimary ? 'textDefault' : 'textSubdued'}
            value={value}
            accountKey={accountKey}
            tokenContract={tokenContract}
            isBalance={false}
            adjustsFontSizeToFit
            numberOfLines={1}
            isDiscreetText={false}
        />
    );

    return (
        <HStack>
            <Box flex={0.4} justifyContent="center">
                <Text variant="body-sm">
                    <Translation id={translationKey} />
                </Text>
            </Box>
            <VStack flex={0.6} alignItems="flex-end" spacing="sp4">
                {isCryptoPrimary ? cryptoFormatter : fiatFormatter}
                {isCryptoPrimary ? fiatFormatter : cryptoFormatter}
            </VStack>
        </HStack>
    );
};
