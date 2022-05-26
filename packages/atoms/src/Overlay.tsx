import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import React from 'react';
import { Dimensions } from 'react-native';
import { Box } from './Box';

const overlayStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray500,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
}));

export const Overlay = () => {
    const { applyStyle } = useNativeStyles();
    return <Box style={applyStyle(overlayStyle)} />;
};
