import { ReactNode } from 'react';

import { RequireOneOrNone } from 'type-fest';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { GoBackIcon } from './GoBackIcon';
import { CloseActionType } from '../navigators';

export type ScreenSubHeaderProps = RequireOneOrNone<
    {
        content?: ReactNode;
        rightIcon?: ReactNode;
        leftIcon?: ReactNode;
        closeActionType?: CloseActionType;
        customHorizontalPadding?: number;
    },
    'leftIcon' | 'closeActionType'
>;

const ICON_SIZE = 48;

const headerStyle = prepareNativeStyle<{ customHorizontalPadding?: number }>(
    (utils, { customHorizontalPadding }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: customHorizontalPadding || utils.spacings.sp8,
        backgroundColor: utils.colors.backgroundSurfaceElevation0,
        height: ICON_SIZE + 2 * utils.spacings.sp8,
    }),
);

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

export const ScreenSubHeader = ({
    content,
    rightIcon,
    leftIcon,
    closeActionType,
    customHorizontalPadding,
}: ScreenSubHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(headerStyle, { customHorizontalPadding })}>
            <Box style={applyStyle(iconWrapperStyle)}>
                {leftIcon || <GoBackIcon closeActionType={closeActionType} />}
            </Box>
            <Box alignItems="center">
                {typeof content === 'string' ? (
                    <Text
                        variant="highlight"
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        testID="@screen/sub-header/title"
                    >
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
