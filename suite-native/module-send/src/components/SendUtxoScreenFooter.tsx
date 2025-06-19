import Animated, { SlideInDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { Box, HStack, Text } from '@suite-native/atoms';

import { useUtxoSelection } from '../hooks/useUxtoSelection';

export const CoinControlScreenFooter = () => {
    const { totalSelectedAmount } = useUtxoSelection();
    const { CryptoAmountFormatter } = useFormatters();

    return (
        <Animated.View entering={SlideInDown}>
            <Box padding="sp16">
                <HStack>
                    <Text>Selected</Text>
                    <Text>
                        <CryptoAmountFormatter value={totalSelectedAmount} symbol="btc" />
                    </Text>
                </HStack>
            </Box>
        </Animated.View>
    );
};
