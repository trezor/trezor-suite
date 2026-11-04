import { Box, CircularSpinner, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const SPINNER_SIZE = 16;
const SPINNER_WIDTH = 2;

const spinnerContainerStyle = prepareNativeStyle(() => ({
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
}));

export const PortfolioAssetsLoader = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp4" alignItems="center" testID="@home/portfolio-assets/show-more/loading">
            <Text variant="body-xs" color="contentTertiary">
                <Translation id="moduleHome.assets.loadingBalances" />
            </Text>
            <Box style={applyStyle(spinnerContainerStyle)}>
                <CircularSpinner
                    size={SPINNER_SIZE}
                    color="contentTertiary"
                    width={SPINNER_WIDTH}
                />
            </Box>
        </HStack>
    );
};
