import { type ReactNode } from 'react';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type CloseActionType } from '../navigators';
import { GoBackIcon } from './GoBackIcon';
import { ScreenHeaderContent, type ScreenHeaderContentProps } from './ScreenHeaderContent';

export type ScreenHeaderProps = ScreenHeaderContentProps &
    (
        | {
              leftIcon?: ReactNode;
              closeActionType?: never;
          }
        | {
              leftIcon?: never;
              closeActionType?: CloseActionType;
          }
    ) & {
        closeAction?: () => void;
        rightIcon?: ReactNode;
    };

const ICON_SIZE = 40; // i.e. medium IconButton size

const headerStyle = prepareNativeStyle<{ insets: EdgeInsets }>((utils, { insets }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // With `space-between` this only engages once the row is full, i.e. exactly when wide
    // content would otherwise butt against the side icons on a narrow screen.
    gap: utils.spacings.sp12,
    paddingTop: utils.spacings.sp8,
    paddingLeft: Math.max(insets.left, utils.spacings.sp16),
    paddingRight: Math.max(insets.right, utils.spacings.sp16),
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
    minHeight: ICON_SIZE,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    minWidth: ICON_SIZE,
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
    const insets = useSafeAreaInsets();

    return (
        <Box style={applyStyle(headerStyle, { insets })}>
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
