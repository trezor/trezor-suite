import { StyleSheet } from 'react-native';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

const overlayWrapperStyle = prepareNativeStyle(utils => ({
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
}));

export const BiometricOverlay = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(overlayWrapperStyle)}>
            <Icon name="trezor" size="extraLarge" color="iconOnPrimary" />
        </Box>
    );
};
