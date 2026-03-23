import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { Box, Button, Card, HStack, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CustomFeeLabel } from './CustomFeeLabel';
import { selectFeeLevels } from '../../../selectors';

export type CustomFeeCardProps = {
    accountKey: AccountKey;
    onEdit: () => void;
    onCancel: () => void;
};

const cardStyle = prepareNativeStyle(utils => ({
    ...utils.boxShadows.none,
}));

export const CustomFeeCard = ({ accountKey, onEdit, onCancel }: CustomFeeCardProps) => {
    const { applyStyle } = useNativeStyles();

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
                                    variant="body-md"
                                    isDiscreetText={false}
                                />
                                <CryptoAmountFormatter
                                    value={customFeeTransaction?.fee}
                                    symbol={symbol}
                                    isBalance={false}
                                    variant="body-sm"
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    isDiscreetText={false}
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
