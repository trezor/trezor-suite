import { useSelector } from 'react-redux';

import { selectIsDeviceConnectedViaBluetooth } from '@suite-common/wallet-core';
import { Box, Image } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const imageStyle = prepareNativeStyle<{ maxHeight?: number }>((_, { maxHeight }) => ({
    width: 61,
    height: 167,
    maxHeight,
    contentFit: 'contain',
}));

export type ConnectorImageProps = {
    maxHeight?: number;
};

export const ConnectorImage = ({ maxHeight }: ConnectorImageProps) => {
    const { applyStyle } = useNativeStyles();

    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);

    if (!isDeviceConnectedViaBluetooth) {
        return (
            <Image
                source={require('../assets/connector.png')}
                style={applyStyle(imageStyle, { maxHeight })}
            />
        );
    }

    return <Box style={applyStyle(imageStyle, { maxHeight })} />;
};
