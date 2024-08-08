import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { BtcSvg } from '../assets/BtcSvg';

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
}));

export const BtcOnlyCoinEnablingContent = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(contentStyle)}>
            <VStack spacing="large" alignItems="center">
                <BtcSvg />
                <VStack spacing="small">
                    <Text textAlign="center" variant="titleSmall">
                        <Translation id="moduleSettings.coinEnabling.btcOnly.title" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id="moduleSettings.coinEnabling.btcOnly.subtitle" />
                    </Text>
                </VStack>
            </VStack>
        </Box>
    );
};
