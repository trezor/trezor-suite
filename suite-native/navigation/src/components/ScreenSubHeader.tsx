import { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { GoBackIcon } from './GoBackIcon';

type ScreenSubHeaderProps = {
    content?: ReactNode;
    rightIcon?: ReactNode;
    leftIcon?: ReactNode;
};

const ICON_SIZE = 48;

const headerStyle = prepareNativeStyle(utils => {
    const padding = utils.spacings.s;

    return {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding,
        backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
        height: ICON_SIZE + padding * 2,
    };
});

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

export const ScreenSubHeader = ({ content, rightIcon, leftIcon }: ScreenSubHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(headerStyle)}>
            <Box style={applyStyle(iconWrapperStyle)}>{leftIcon || <GoBackIcon />}</Box>
            <Box alignItems="center">
                {typeof content === 'string' ? (
                    <Text variant="highlight" adjustsFontSizeToFit numberOfLines={1}>
                        {content}
                    </Text>
                ) : (
                    content
                )}
            </Box>
            <Box style={applyStyle(iconWrapperStyle)}>{rightIcon}</Box>
        </Box>
    );
};
