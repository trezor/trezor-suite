import { StyleSheet } from 'react-native';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';
import { BlurredScreenOverlay } from '@suite-native/screen-overlay';

const overlayWrapperStyle = prepareNativeStyle((_, { isDisplayed }) => ({
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',

    /* To ensure that the overlay is displayed correctly when the app goes to the `background` state, 
    it is important to pre-render the content and set its visibility using the `display` style when necessary. 
    This ensures that the content has enough time to render before the app transitions to the `background` state. 
    Failing to do so would may result in a blank screen being displayed. */
    extend: {
        condition: !isDisplayed,
        style: {
            display: 'none',
        },
    },
}));

type BiometricsOverlayProps = {
    isDisplayed: boolean;
};

export const BiometricOverlay = ({ isDisplayed }: BiometricsOverlayProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(overlayWrapperStyle, { isDisplayed })}>
            <BlurredScreenOverlay isDimmed={false} blurValue={15} />
            <Icon name="trezor" customSize={70} color="iconDefault" />
        </Box>
    );
};
