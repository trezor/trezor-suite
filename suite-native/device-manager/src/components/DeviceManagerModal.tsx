import { type ReactNode } from 'react';
import { type GestureResponderEvent, Modal, Pressable, useWindowDimensions } from 'react-native';
import { FadeIn, SlideInUp } from 'react-native-reanimated';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedView, Box, HStack, ScreenHeaderWrapper } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';

type DeviceManagerModalProps = {
    children: ReactNode;
    hasContent: boolean;
    customSwitchRightView?: ReactNode;
    onClose?: () => void;
    footer?: ReactNode;
};

const PANEL_MAX_HEIGHT_RATIO = 0.8;

const modalBackgroundOverlayStyle = prepareNativeStyle<{
    windowWidth: number;
    windowHeight: number;
}>((utils, { windowWidth, windowHeight }) => ({
    flex: 1,
    backgroundColor: utils.colors.surfaceFillMediaOverlay,
    // this need to be here so the background does not stretch out when appearing
    // new RN architecture might fix this, so evaluate later
    width: windowWidth,
    height: windowHeight,
}));

const deviceManagerModalWrapperStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    backgroundColor: utils.colors.surfaceFillPage,
    borderBottomLeftRadius: utils.borders.radii.r12,
    borderBottomRightRadius: utils.borders.radii.r12,
    borderWidth: utils.borders.widths.small,
    borderTopWidth: 0,
    borderColor: utils.colors.borderNeutral,
    overflow: 'hidden',
}));

const deviceManagerHeaderStyle = prepareNativeStyle<{ topInset: number; hasContent: boolean }>(
    (utils, { topInset, hasContent }) => ({
        paddingTop: topInset,
        backgroundColor: utils.colors.surfaceFillRaised,
        borderBottomWidth: hasContent ? utils.borders.widths.small : 0,
        borderBottomColor: utils.colors.borderNeutral,
    }),
);

const modalHeaderStyle = prepareNativeStyle(utils => ({
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp16,
}));

const modalPanelStyle = prepareNativeStyle<{ insets: EdgeInsets; windowHeight: number }>(
    (_, { insets, windowHeight }) => ({
        marginLeft: insets.left,
        marginRight: insets.right,
        maxHeight: windowHeight * PANEL_MAX_HEIGHT_RATIO - insets.bottom,
    }),
);

const modalContentStyle = prepareNativeStyle(() => ({ flexShrink: 1 }));

export const DeviceManagerModal = ({
    children,
    hasContent,
    customSwitchRightView,
    onClose,
    footer,
}: DeviceManagerModalProps) => {
    const { applyStyle } = useNativeStyles();

    const insets = useSafeAreaInsets();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const handleClose = () => {
        onClose?.();
        setIsDeviceManagerVisible(false);
    };

    const handlePressOutside = (event: GestureResponderEvent) => {
        if (event.target === event.currentTarget) handleClose();
    };

    return (
        <Modal
            transparent
            onRequestClose={handleClose}
            visible={isDeviceManagerVisible}
            presentationStyle="overFullScreen"
            animationType="fade"
            statusBarTranslucent={true}
        >
            <Pressable
                style={applyStyle(modalBackgroundOverlayStyle, { windowWidth, windowHeight })}
                onPress={handlePressOutside}
            >
                <AnimatedView
                    entering={SlideInUp.damping(30)}
                    style={applyStyle(modalPanelStyle, { insets, windowHeight })}
                >
                    <AnimatedView style={applyStyle(deviceManagerModalWrapperStyle)}>
                        <Pressable
                            onPress={handleClose}
                            style={applyStyle(deviceManagerHeaderStyle, {
                                topInset: insets.top,
                                hasContent,
                            })}
                        >
                            <ScreenHeaderWrapper style={applyStyle(modalHeaderStyle)}>
                                <HStack
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing="sp16"
                                    flex={1}
                                >
                                    <Box flexShrink={1}>
                                        <DeviceItemContent
                                            headerTextVariant="headline-sm"
                                            isCompact={false}
                                        />
                                    </Box>
                                    {customSwitchRightView}
                                </HStack>
                            </ScreenHeaderWrapper>
                        </Pressable>
                        <AnimatedView entering={FadeIn} style={applyStyle(modalContentStyle)}>
                            {children}
                        </AnimatedView>
                    </AnimatedView>
                    {footer}
                </AnimatedView>
            </Pressable>
        </Modal>
    );
};
