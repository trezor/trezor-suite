import { useSelector } from 'react-redux';

import { selectIsBluetoothDevice } from '@suite-common/wallet-core';
import { Box, Image } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const imageStyle = prepareNativeStyle<{ maxHeight?: number }>((_, { maxHeight }) => ({
    width: '100%',
    height: 170,
    maxHeight,
    contentFit: 'contain',
}));

export type ConnectorImageProps = {
    maxHeight?: number;
};

export const ConnectorImage = ({ maxHeight }: ConnectorImageProps) => {
    const { applyStyle } = useNativeStyles();

    const isBluetoothDevice = useSelector(selectIsBluetoothDevice);

    if (!isBluetoothDevice) {
        return (
            <Image
                source={require('../assets/connector.webp')}
                style={applyStyle(imageStyle, { maxHeight })}
            />
        );
    }

    return <Box style={applyStyle(imageStyle, { maxHeight })} />;
};
