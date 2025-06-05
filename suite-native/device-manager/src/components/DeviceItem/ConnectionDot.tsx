import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectIsDeviceInBootloader } from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ConnectionDotProps = {
    isConnected: boolean;
};

const dotStyle = prepareNativeStyle<{ isConnected: boolean; isDeviceInBootloaderMode: boolean }>(
    (utils, { isConnected, isDeviceInBootloaderMode }) => ({
        width: utils.spacings.sp8,
        height: utils.spacings.sp8,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.iconDisabled,
        extend: [
            {
                condition: isConnected,
                style: {
                    backgroundColor: utils.colors.textSecondaryHighlight,
                },
            },
            {
                condition: isDeviceInBootloaderMode,
                style: {
                    backgroundColor: utils.colors.textAlertBlue,
                },
            },
        ],
    }),
);

export const ConnectionDot = ({ isConnected }: ConnectionDotProps) => {
    const { applyStyle } = useNativeStyles();
    const isDeviceInBootloaderMode = useSelector(selectIsDeviceInBootloader);

    return <View style={applyStyle(dotStyle, { isConnected, isDeviceInBootloaderMode })} />;
};
