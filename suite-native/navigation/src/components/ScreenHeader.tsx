import { ReactNode, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { RequireOneOrNone } from 'type-fest';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { GoBackIcon } from './GoBackIcon';
import { CloseActionType } from '../navigators';
import { ScreenHeaderContent } from './ScreenHeaderContent';

export type ScreenSubHeaderProps = RequireOneOrNone<
    {
        content?: ReactNode;
        subtitle?: ReactNode;
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

export const ScreenHeader = ({
    content,
    rightIcon,
    leftIcon,
    closeActionType,
    closeAction,
}: ScreenSubHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const [height, setHeight] = useState(0);

    const handleLayout = (e: LayoutChangeEvent) => {
        setHeight(e.nativeEvent.layout.height);
    };

    return (
        <VStack spacing="sp16" style={{ minHeight: height }} onLayout={handleLayout}>
            <Box style={applyStyle(headerStyle)}>
                <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-left">
                    {leftIcon !== undefined ? (
                        leftIcon
                    ) : (
                        <GoBackIcon closeActionType={closeActionType} closeAction={closeAction} />
                    )}
                </Box>
                <Box alignItems="center">
                    <ScreenHeaderContent content={content} />
                </Box>
                <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-right">
                    {rightIcon}
                </Box>
            </Box>
        </VStack>
    );
};
