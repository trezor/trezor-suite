import { ComponentProps, ReactElement, ReactNode } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { RequireOneOrNone } from 'type-fest';

import { AnimatedBox, Box, IconButton, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { GoBackIcon } from './GoBackIcon';
import { CloseActionType } from '../navigators';
import { ScreenHeaderContent } from './ScreenHeaderContent';

export type ScreenHeaderProps = RequireOneOrNone<
    {
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
            <ScreenHeaderContent title={title} customContent={customContent} />

            <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-right">
                {rightIcon}
            </Box>
        </Box>
    );
};

const deviceInteractionHeaderContainerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.textDefault,
    overflow: 'hidden',
    alignItems: 'center',
}));

const deviceInteractionHeaderStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.textDefault,
    width: '100%',
}));

export const DeviceInteractionScreenHeader = () => {
    const { applyStyle } = useNativeStyles();

    const isScreenToggled = useSharedValue(false);
    const animatedStyle = useAnimatedStyle(() => ({
        height: withTiming(isScreenToggled.value ? 700 : 70, { duration: 500 }),
    }));

    return (
        <>
            <AnimatedBox style={[applyStyle(deviceInteractionHeaderContainerStyle), animatedStyle]}>
                <Box style={[applyStyle(headerStyle), applyStyle(deviceInteractionHeaderStyle)]}>
                    <Box style={applyStyle(iconWrapperStyle)} testID="@screen/sub-header/icon-left">
                        <GoBackIcon closeActionType="close" />
                    </Box>
                    <Text color="textDefaultInverted">Continue on your Trezor</Text>
                    <Box
                        style={applyStyle(iconWrapperStyle)}
                        testID="@screen/sub-header/icon-right"
                    >
                        <IconButton
                            iconName="arrowRight"
                            size="medium"
                            colorScheme="tertiaryElevation0"
                            onPress={() => (isScreenToggled.value = !isScreenToggled.value)}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        />
                    </Box>
                </Box>
                <Box style={{ flex: 1, alignItems: 'center', paddingTop: 300 }}>
                    <Box style={{ backgroundColor: 'red', height: 100, width: 100 }}></Box>
                    <Text color="textDefaultInverted">This is a beautiful Trezor render 🙀</Text>
                </Box>
            </AnimatedBox>
        </>
    );
};
