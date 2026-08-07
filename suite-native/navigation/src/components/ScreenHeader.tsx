import { type ReactNode } from 'react';

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

const headerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
    minHeight: 40, // i.e. medium IconButton size
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
            <Box testID="@screen/sub-header/icon-left">
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
            <Box testID="@screen/sub-header/icon-right">{rightIcon}</Box>
        </Box>
    );
};
