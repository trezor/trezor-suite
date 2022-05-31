import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';

type Props = {
    content: string;
    onClose: () => void;
};

const tipToastStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: utils.colors.black,
    color: utils.colors.white,
    borderRadius: utils.borders.radii.basic,
    padding: utils.spacings.sm,
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.basic,
    backgroundColor: utils.colors.gray800,
    width: 40,
    height: 40,
}));

export const TipToast = ({ content, onClose }: Props) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(tipToastStyle)}>
            <Box>
                <Text color="gray400" variant="hint">
                    TIP
                </Text>
                <Text color="white" variant="hint">
                    {content}
                </Text>
            </Box>
            <TouchableOpacity onPress={onClose} style={applyStyle(iconWrapperStyle)}>
                <Icon name="close" color="white" />
            </TouchableOpacity>
        </Box>
    );
};
