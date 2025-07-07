// ScreenHeader.tsx
import { ComponentProps, ReactElement, ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { RequireOneOrNone } from 'type-fest';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { GoBackIcon } from './GoBackIcon';
import { CloseActionType } from '../navigators';

export type ScreenHeaderProps = RequireOneOrNone<
    {
        // Content (optional, mutually exclusive)
        title?: ReactElement<ComponentProps<typeof Translation>> | string;
        customContent?: ReactNode;
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
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
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
                    <GoBackIcon closeActionType={closeActionType} closeAction={closeAction} />
                )}
            </Box>
            {customContent && <Box alignItems="center">{customContent}</Box>}
            {title && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <Box alignItems="center">
                        <Text
                            variant="highlight"
                            adjustsFontSizeToFit
                            numberOfLines={1}
                            testID="@screen/sub-header/title"
                        >
                            {title}
                        </Text>
                    </Box>
                </Animated.View>
            )}

            <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-right">
                {rightIcon}
            </Box>
        </Box>
    );
};
