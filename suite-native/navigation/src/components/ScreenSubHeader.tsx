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
        closeAction?: () => void;
    },
    'leftIcon' | 'closeActionType'
>;

const ICON_SIZE = 48;

const headerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    minHeight: ICON_SIZE,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

export const ScreenSubHeader = ({
    content,
    rightIcon,
    leftIcon,
    closeActionType,
    closeAction,
}: ScreenSubHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(headerStyle)}>
            <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-left">
                {leftIcon || (
                    <GoBackIcon closeActionType={closeActionType} closeAction={closeAction} />
                )}
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
            <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-right">
                {rightIcon}
            </Box>
        </Box>
    );
};
