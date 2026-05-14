import { type ReactNode } from 'react';

import { type RequireOneOrNone } from 'type-fest';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { GoBackIcon } from './GoBackIcon';
import { type CloseActionType } from '../navigators';
import { ScreenHeaderContent, type ScreenHeaderContentProps } from './ScreenHeaderContent';

export type ScreenHeaderProps = ScreenHeaderContentProps &
    RequireOneOrNone<
        {
            leftIcon?: ReactNode;
            closeActionType?: CloseActionType;
            rightIcon?: ReactNode;
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
    backgroundColor: utils.colors.surfaceFillPage,
    minHeight: ICON_SIZE,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

export const ScreenHeader = ({
    customContent,
    rightIcon,
    leftIcon,
    title,
    closeActionType,
    closeAction,
}: ScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(headerStyle)}>
            <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-left">
                {leftIcon !== undefined ? (
                    leftIcon
                ) : (
                    <GoBackIcon
                        closeActionType={closeActionType}
                        closeAction={closeAction}
                        testID="@screen/sub-header/go-back-button"
                    />
                )}
            </Box>
            <ScreenHeaderContent title={title} customContent={customContent} />

            <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-right">
                {rightIcon}
            </Box>
        </Box>
    );
};
