import { Modal, Pressable } from 'react-native';
import { ReactNode } from 'react';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';

import { ScreenHeaderWrapper, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceSwitch } from './DeviceSwitch';
import { useDeviceManager } from '../hooks/useDeviceManager';

type DeviceManagerModalProps = {
    children: ReactNode;
};

const MANAGER_MODAL_BOTTOM_RADIUS = 20;

const modalBackgroundOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundNeutralBold),
}));

const deviceManagerModalWrapperStyle = prepareNativeStyle<{ insets: EdgeInsets }>(
    (utils, { insets }) => ({
        paddingTop: Math.max(insets.top, utils.spacings.small),
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
        borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    }),
);

const contentWrapperStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
    paddingBottom: utils.spacings.medium,
}));

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DeviceManagerModal = ({ children }: DeviceManagerModalProps) => {
    const { applyStyle } = useNativeStyles();

    const insets = useSafeAreaInsets();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const handleClose = () => {
        setIsDeviceManagerVisible(false);
    };

    return (
        <Modal transparent onRequestClose={handleClose} visible={isDeviceManagerVisible}>
            <AnimatedPressable
                style={applyStyle(modalBackgroundOverlayStyle)}
                entering={FadeIn}
                exiting={FadeOut}
                onPress={handleClose}
            >
                <Animated.View
                    style={applyStyle(deviceManagerModalWrapperStyle, { insets })}
                    entering={SlideInUp.springify().damping(50)}
                    exiting={SlideOutUp}
                >
                    <ScreenHeaderWrapper>
                        <DeviceSwitch />
                    </ScreenHeaderWrapper>
                    <VStack spacing="medium" style={applyStyle(contentWrapperStyle)}>
                        {children}
                    </VStack>
                </Animated.View>
            </AnimatedPressable>
        </Modal>
    );
};
