import { Icon } from '../Icon/Icon';
import React from 'react';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { IconType } from '../Icon/iconTypes';
import { Box } from '../Box';

type ListItemIconProps = {
    iconType: IconType;
};

const listItemIconStyle = prepareNativeStyle(utils => ({
    height: 48,
    width: 48,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.gray200,
}));

export const ListItemIcon = ({ iconType }: ListItemIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box justifyContent="center" alignItems="center" marginRight="md">
            <Box justifyContent="center" alignItems="center" style={applyStyle(listItemIconStyle)}>
                <Icon type={iconType} />
            </Box>
        </Box>
    );
};
