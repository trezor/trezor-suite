import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';

const bottomSheetGrabberStyle = prepareNativeStyle(utils => ({
    width: 32,
    height: 4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.borderNeutral,
}));

export const BottomSheetGrabber = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flex={1} alignItems="center">
            <Box style={applyStyle(bottomSheetGrabberStyle)} />
        </Box>
    );
};
