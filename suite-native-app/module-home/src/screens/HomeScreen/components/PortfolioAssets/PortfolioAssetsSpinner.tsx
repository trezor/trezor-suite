import { Box, CircularSpinner } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const SPINNER_SIZE = 16;
const SPINNER_WIDTH = 2;

const spinnerContainerStyle = prepareNativeStyle(() => ({
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
}));

export const PortfolioAssetsSpinner = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(spinnerContainerStyle)}>
            <CircularSpinner size={SPINNER_SIZE} color="contentTertiary" width={SPINNER_WIDTH} />
        </Box>
    );
};
