import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';

import { Box } from './Box';
import { Text } from './Text';

type AlertBoxProps = {
    title: string;
};

const alertWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: utils.spacings.medium,
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation0,
}));

const textWidthStyle = prepareNativeStyle(_ => ({
    width: '80%',
    marginLeft: 12,
}));

const ICON_SIZE = 48;
const iconWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.round,
}));

export const AlertBox = ({ title }: AlertBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(alertWrapperStyle)}>
            <Box style={applyStyle(iconWrapperStyle)}>
                <Icon size="medium" name="info" color="iconAlertBlue" />
            </Box>
            <Box style={applyStyle(textWidthStyle)}>
                <Text color="textAlertBlue">{title}</Text>
            </Box>
        </Box>
    );
};
