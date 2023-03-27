import React from 'react';

import { IconName } from '@trezor/icons';

import { Box } from '../Box';
import { RoundedIcon } from '../RoundedIcon';

type ListItemIconProps = {
    iconName: IconName;
};

export const ListItemIcon = ({ iconName }: ListItemIconProps) => (
    <Box justifyContent="center" alignItems="center" marginRight="medium">
        <RoundedIcon
            name={iconName}
            backgroundColor="backgroundSurfaceElevation2"
            iconColor="iconSubdued"
        />
        <RoundedIcon name={iconName} backgroundColor="backgroundSurfaceElevation2" />
    </Box>
);
