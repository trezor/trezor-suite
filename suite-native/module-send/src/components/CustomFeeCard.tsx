import { useSelector } from 'react-redux';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { useRoute } from '@react-navigation/native';

import { Card, HStack, VStack, Text, Box, Button } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { networks, NetworkType } from '@suite-common/wallet-config';
import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';

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

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!isFinalPrecomposedTransaction(customFeeTransaction) || !networkSymbol) {
        return null;
    }

    const { networkType } = networks[networkSymbol];

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
                                    network={networkSymbol}
                                    variant="body"
                                />
                                <CryptoAmountFormatter
                                    value={customFeeTransaction?.fee}
                                    network={networkSymbol}
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
