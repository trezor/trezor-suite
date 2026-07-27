import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type ConnectionDotProps = {
    isConnected: boolean;
    isDeviceInBootloaderMode?: boolean;
};

const dotStyle = prepareNativeStyle<{ isConnected: boolean; isDeviceInBootloaderMode: boolean }>(
    (utils, { isConnected, isDeviceInBootloaderMode }) => ({
        width: utils.spacings.sp8,
        height: utils.spacings.sp8,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.contentDisabled,
        extend: [
            {
                condition: isConnected,
                style: {
                    backgroundColor: utils.colors.contentBrand,
                },
            },
            {
                condition: isDeviceInBootloaderMode,
                style: {
                    backgroundColor: utils.colors.contentInfo,
                },
            },
        ],
    }),
);

export const ConnectionDot = ({
    isConnected,
    isDeviceInBootloaderMode = false,
}: ConnectionDotProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(dotStyle, { isConnected, isDeviceInBootloaderMode })} />;
};
