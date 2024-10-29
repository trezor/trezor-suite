import { useRoute } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { HStack, VStack, Text, Box } from '@suite-native/atoms';
import { CoinAmountFormatter, CoinToFiatAmountFormatter } from '@suite-native/formatters';
import { TxKeyPath, Translation } from '@suite-native/intl';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>['route'];

export const ReviewOutputItemValues = ({
    tokenContract,
    value,
    translationKey,
}: {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    value: string;
    translationKey: TxKeyPath;
}) => {
    const route = useRoute<RouteProps>();

    const { accountKey } = route.params;

    return (
        <HStack>
            <Box flex={0.4} justifyContent="center">
                <Text variant="hint">
                    <Translation id={translationKey} />
                </Text>
            </Box>
            <VStack flex={0.6} alignItems="flex-end" spacing="sp4">
                <CoinToFiatAmountFormatter
                    variant="hint"
                    color="textDefault"
                    value={value}
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                />
                <CoinAmountFormatter
                    variant="hint"
                    color="textSubdued"
                    value={value}
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    isBalance={false}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                />
            </VStack>
        </HStack>
    );
};
