import React from 'react';

import { Icon, IconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';

type ListItemIconProps = {
    iconName: IconName;
};

const listItemIconStyle = prepareNativeStyle(utils => ({
    height: 48,
    width: 48,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.gray200,
}));

export const ListItemIcon = ({ iconName }: ListItemIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box justifyContent="center" alignItems="center" marginRight="medium">
            <Box justifyContent="center" alignItems="center" style={applyStyle(listItemIconStyle)}>
                <Icon name={iconName} />
            </Box>
        </Box>
    );
};
