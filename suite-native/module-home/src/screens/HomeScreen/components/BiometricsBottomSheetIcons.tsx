import { Platform } from 'react-native';

import { IconName, Icon } from '@suite-common/icons';
import { HStack, Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ICON_SIZE = 64;
const ICON_WRAPPER_SIZE = 88;

const iconWrapperStyle = prepareNativeStyle(utils => ({
    padding: 12,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    color: utils.colors.iconPrimaryDefault,
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
}));

export const BiometricsBottomSheetIcons = ({
    isFacialEnabled,
    isFingerprintEnabled,
}: {
    isFacialEnabled: boolean;
    isFingerprintEnabled: boolean;
}) => {
    const { applyStyle } = useNativeStyles();

    const faceRecognitionIcon: IconName = Platform.OS === 'ios' ? 'faceId' : 'face';
    const fingerprintIcon: IconName = Platform.OS === 'ios' ? 'touchId' : 'fingerprint';
    const primaryIcon: IconName = isFingerprintEnabled ? fingerprintIcon : faceRecognitionIcon;

    const isSecondaryIconDisplayed =
        Platform.OS === 'android' && isFingerprintEnabled && isFacialEnabled;

    return (
        <HStack spacing="extraSmall">
            <Box style={applyStyle(iconWrapperStyle)}>
                <Icon name={primaryIcon} color="iconPrimaryDefault" customSize={ICON_SIZE} />
            </Box>
            {isSecondaryIconDisplayed && (
                <Box style={applyStyle(iconWrapperStyle)}>
                    <Icon name="face" color="iconPrimaryDefault" customSize={ICON_SIZE} />
                </Box>
            )}
        </HStack>
    );
};
