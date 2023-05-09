import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

import { Box } from './Box';
import { Text } from './Text';

type AlertBoxProps = {
    title: string;
    isIconVisible?: boolean;
};

const alertWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: utils.spacings.medium,
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation0,
}));

const textWidthStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const titleStyle = prepareNativeStyle<{ isIconVisible: boolean }>((_, { isIconVisible }) => ({
    textAlign: isIconVisible ? 'left' : 'center',
}));

const ICON_SIZE = 48;
const iconWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.round,
    marginRight: utils.spacings.small * 1.5,
}));

export const AlertBox = ({ title, isIconVisible = true }: AlertBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(alertWrapperStyle)}>
            {isIconVisible && (
                <Box style={applyStyle(iconWrapperStyle)}>
                    <Icon size="medium" name="info" color="iconAlertBlue" />
                </Box>
            )}
            <Box style={applyStyle(textWidthStyle)}>
                <Text color="textAlertBlue" style={applyStyle(titleStyle, { isIconVisible })}>
                    {title}
                </Text>
            </Box>
        </Box>
    );
};
