import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Box, Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SendFeesFormValues } from '../sendFeesFormSchema';
import { selectFeeLevels } from '../sendFormSlice';

type CustomFeeCardProps = {
    onEdit: () => void;
    onCancel: () => void;
};

const cardStyle = prepareNativeStyle(utils => ({
    ...utils.boxShadows.none,
}));

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];

const CustomFeeLabel = ({ networkType }: { networkType: NetworkType }) => {
    const feeUnits = getFeeUnits(networkType);

    const { watch } = useFormContext<SendFeesFormValues>();
    const { customFeeLimit, customFeePerUnit } = watch();

    const formattedFeePerUnit = `${customFeePerUnit} ${feeUnits}`;

    if (networkType === 'ethereum') {
        return (
            <VStack spacing="sp2" flex={1}>
                <Text variant="highlight">
                    <Translation id="moduleSend.fees.custom.card.label" />
                </Text>
                <Text variant="hint" color="textSubdued" numberOfLines={1} adjustsFontSizeToFit>
                    <Translation
                        id="moduleSend.fees.custom.card.ethereumValues"
                        values={{ gasPrice: formattedFeePerUnit, gasLimit: customFeeLimit }}
                    />
                </Text>
            </VStack>
        );
    }

    return (
        <Text variant="highlight">
            <Translation id="moduleSend.fees.custom.card.label" />
            {' • '}
            <Text color="textSubdued">{formattedFeePerUnit}</Text>
        </Text>
    );
};

export const CustomFeeCard = ({ onEdit, onCancel }: CustomFeeCardProps) => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute<RouteProps>();
    const { accountKey } = route.params;

    const feeLevels = useSelector(selectFeeLevels);

    const customFeeTransaction = feeLevels.custom;

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!isFinalPrecomposedTransaction(customFeeTransaction) || !symbol) {
        return null;
    }

    const networkType = getNetworkType(symbol);

    return (
        <Animated.View entering={FadeInLeft.delay(300)} exiting={FadeOutLeft}>
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing="sp16">
                    <VStack>
                        <HStack flex={1} justifyContent="space-between" alignItems="center">
                            <CustomFeeLabel networkType={networkType} />
                            <VStack alignItems="flex-end" spacing={0}>
                                <CryptoToFiatAmountFormatter
                                    value={customFeeTransaction.fee}
                                    symbol={symbol}
                                    variant="body"
                                />
                                <CryptoAmountFormatter
                                    value={customFeeTransaction?.fee}
                                    symbol={symbol}
                                    isBalance={false}
                                    variant="hint"
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                />
                            </VStack>
                        </HStack>
                    </VStack>
                    <HStack flex={1} justifyContent="space-between">
                        <Box flex={1}>
                            <Button onPress={onCancel} colorScheme="redElevation1">
                                <Translation id="generic.buttons.cancel" />
                            </Button>
                        </Box>
                        <Box flex={2}>
                            <Button onPress={onEdit} colorScheme="tertiaryElevation1">
                                <Translation id="generic.buttons.edit" />
                            </Button>
                        </Box>
                    </HStack>
                </VStack>
            </Card>
        </Animated.View>
    );
};
