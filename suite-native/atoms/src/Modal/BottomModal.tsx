import React, { ReactNode, useCallback, useEffect } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    useAnimatedGestureHandler,
    runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';

import { Box } from '../Box';
import { Text } from '../Text';
import { BottomModalContainer } from './BottomModalContainer';

type BottomModalProps = {
    isVisible: boolean;
    onVisibilityChange: (isVisible: boolean) => void;
    children: ReactNode;
    title: string;
    hasBackArrow?: boolean;
    onBackArrowClick?: () => void;
};

type WrapperStyleProps = {
    insetBottom: number;
};

type GestureHandlerContext = {
    translateY: number;
};

const modalWrapperStyle = prepareNativeStyle<WrapperStyleProps>((utils, { insetBottom }) => ({
    backgroundColor: utils.colors.gray100,
    borderTopLeftRadius: utils.borders.radii.large,
    borderTopRightRadius: utils.borders.radii.large,
    paddingBottom: Math.max(insetBottom, utils.spacings.medium),
}));

const CLOSE_BUTTON_SIZE = 40;
const SCREEN_HEIGHT = Dimensions.get('screen').height;

const closeButtonStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray100,
    borderRadius: utils.borders.radii.round,
    height: CLOSE_BUTTON_SIZE,
    width: CLOSE_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
}));

const modalHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: utils.spacings.medium,
}));

export const BottomModal = ({
    isVisible,
    onVisibilityChange,
    title,
    onBackArrowClick,
    children,
    hasBackArrow = false,
}: BottomModalProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const translatePanY = useSharedValue(SCREEN_HEIGHT);

    const animatedModalWrapperStyle = useAnimatedStyle(() => ({
        top: withTiming(interpolate(translatePanY.value, [-1, 0, 1], [0, 0, 1]), {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        }),
    }));

    const closeModalAnimated = () => {
        'worklet';

        translatePanY.value = SCREEN_HEIGHT;
        runOnJS(onVisibilityChange)(false);
    };

    const resetModalAnimated = useCallback(() => {
        'worklet';

        translatePanY.value = 0;
    }, [translatePanY]);

    useEffect(() => {
        if (isVisible) {
            resetModalAnimated();
        }
    }, [isVisible, resetModalAnimated]);

    const panGestureEvent = useAnimatedGestureHandler<
        PanGestureHandlerGestureEvent,
        GestureHandlerContext
    >({
        onStart: (_, context) => {
            context.translateY = translatePanY.value;
        },
        onActive: (event, context) => {
            const { translationY } = event;
            translatePanY.value = translationY + context.translateY;
        },
        onEnd: event => {
            const { translationY, velocityY } = event;
            if (translationY > 0 && velocityY > 2) {
                closeModalAnimated();
            } else {
                resetModalAnimated();
            }
        },
    });

    const handleCloseModal = () => {
        closeModalAnimated();
    };

    return (
        <BottomModalContainer isVisible={isVisible} onClose={handleCloseModal}>
            <PanGestureHandler onGestureEvent={panGestureEvent}>
                <Animated.View
                    style={[
                        animatedModalWrapperStyle,
                        applyStyle(modalWrapperStyle, {
                            insetBottom: insets.bottom,
                        }),
                    ]}
                >
                    <Box style={applyStyle(modalHeaderStyle)}>
                        {hasBackArrow && (
                            <TouchableOpacity onPress={onBackArrowClick}>
                                <Icon name="chevronLeft" />
                            </TouchableOpacity>
                        )}
                        <Text variant="titleSmall">{title}</Text>
                        <TouchableOpacity
                            onPress={handleCloseModal}
                            style={applyStyle(closeButtonStyle)}
                        >
                            <Icon name="close" />
                        </TouchableOpacity>
                    </Box>
                    <Box paddingHorizontal="medium">{children}</Box>
                </Animated.View>
            </PanGestureHandler>
        </BottomModalContainer>
    );
};
