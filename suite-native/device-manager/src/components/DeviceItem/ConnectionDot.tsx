import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ConnectionDotProps = {
    isConnected: boolean;
};

const dotStyle = prepareNativeStyle<{ isConnected: boolean }>((utils, { isConnected }) => ({
    width: utils.spacings.small,
    height: utils.spacings.small,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.iconDisabled,
    extend: {
        condition: isConnected,
        style: {
            backgroundColor: utils.colors.textSecondaryHighlight,
        },
    },
}));

export const ConnectionDot = ({ isConnected }: ConnectionDotProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(dotStyle, { isConnected })} />;
};
