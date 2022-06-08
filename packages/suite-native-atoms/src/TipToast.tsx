import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';

type TipToastProps = {
    title: string;
    description: string;
    onClose: () => void;
};

const tipToastStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: utils.colors.black,
    color: utils.colors.white,
    borderRadius: utils.borders.radii.small,
    padding: utils.spacings.small,
}));

const closeButtonStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.small,
    backgroundColor: utils.colors.gray800,
    width: 40,
    height: 40,
}));

export const TipToast = ({ title, description, onClose }: TipToastProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(tipToastStyle)}>
            <Box>
                <Text color="gray400" variant="hint">
                    {title}
                </Text>
                <Text color="white" variant="hint">
                    {description}
                </Text>
            </Box>
            <TouchableOpacity onPress={onClose} style={applyStyle(closeButtonStyle)}>
                <Icon name="close" color="white" />
            </TouchableOpacity>
        </Box>
    );
};
