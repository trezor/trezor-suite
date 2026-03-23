import { type ReactNode } from 'react';
import { Dimensions, type GestureResponderEvent, Modal, Pressable, StatusBar } from 'react-native';
import Animated, { FadeIn, LinearTransition, SlideInUp } from 'react-native-reanimated';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { selectDeviceState } from '@suite-common/device';
import { Box, HStack, ScreenHeaderWrapper } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeBorders } from '@trezor/theme';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';

type DeviceManagerModalProps = {
    children: ReactNode;
    customSwitchRightView?: ReactNode;
    onClose?: () => void;
    footer?: ReactNode;
};

export const MANAGER_MODAL_BOTTOM_RADIUS = nativeBorders.radii.r12;

const SCREEN_SIZE = Dimensions.get('screen');

const modalBackgroundOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    backgroundColor: utils.transparentize(0.25, utils.colors.backgroundNeutralBold),
    // this need to be here so the background does not stretch out when appearing
    // new RN architecture might fix this, so evaluate later
    width: SCREEN_SIZE.width,
    height: SCREEN_SIZE.height,
}));

const deviceManagerModalWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
}));

const deviceManagerHeaderStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderWidth: utils.borders.widths.small,
    borderBottomLeftRadius: utils.borders.radii.r12,
    borderBottomRightRadius: utils.borders.radii.r12,
    borderColor: utils.colors.borderOnElevation0,
    borderTopWidth: 0,
}));

const deviceSwitchWrapperStyle = prepareNativeStyle<{ insets: EdgeInsets }>(
    (utils, { insets }) => ({
        marginTop: insets.top + (StatusBar.currentHeight ?? 0),
        backgroundColor: utils.colors.backgroundSurfaceElevation0,
        borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
        borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
        borderWidth: utils.borders.widths.small,
        borderTopWidth: 0,
        borderColor: utils.colors.borderElevation0,
        zIndex: 20,
    }),
);

export const DeviceManagerModal = ({
    children,
    customSwitchRightView,
    onClose,
    footer,
}: DeviceManagerModalProps) => {
    const { applyStyle } = useNativeStyles();
    const deviceState = useSelector(selectDeviceState);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    const insets = useSafeAreaInsets();

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
            <Pressable style={applyStyle(modalBackgroundOverlayStyle)} onPress={handlePressOutside}>
                <Animated.View entering={SlideInUp.damping(30)}>
                    <Animated.View
                        style={applyStyle(deviceManagerModalWrapperStyle, { insets })}
                        layout={LinearTransition}
                    >
                        <Animated.View
                            style={applyStyle(deviceSwitchWrapperStyle, { insets })}
                            layout={LinearTransition}
                        >
                            <Pressable
                                onPress={handleClose}
                                style={applyStyle(deviceManagerHeaderStyle)}
                            >
                                <ScreenHeaderWrapper>
                                    <HStack
                                        justifyContent="space-between"
                                        alignItems="center"
                                        spacing="sp16"
                                        flex={1}
                                    >
                                        {(deviceState || shouldFactoryResetBeVisible) && (
                                            <Box flexShrink={1}>
                                                <DeviceItemContent
                                                    deviceState={deviceState ?? undefined}
                                                    headerTextVariant="headline-sm"
                                                    isCompact={false}
                                                />
                                            </Box>
                                        )}
                                        {customSwitchRightView}
                                    </HStack>
                                </ScreenHeaderWrapper>
                            </Pressable>
                            <Animated.View entering={FadeIn}>{children}</Animated.View>
                        </Animated.View>
                    </Animated.View>
                    {footer}
                </Animated.View>
            </Pressable>
        </Modal>
    );
};
