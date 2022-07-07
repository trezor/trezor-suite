import React, { ReactNode, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';
import { BottomModalContainer } from './BottomModalContainer';
import { useBottomModalAnimation } from './useBottomModalAnimation';

type BottomModalProps = {
    isVisible: boolean;
    onVisibilityChange: (isVisible: boolean) => void;
    children: ReactNode;
    title: string;
    onBackArrowClick?: () => void;
};

type WrapperStyleProps = {
    insetBottom: number;
};

const modalWrapperStyle = prepareNativeStyle<WrapperStyleProps>((utils, { insetBottom }) => ({
    backgroundColor: utils.colors.gray100,
    borderTopLeftRadius: utils.borders.radii.large,
    borderTopRightRadius: utils.borders.radii.large,
    paddingBottom: Math.max(insetBottom, utils.spacings.medium),
}));

const CLOSE_BUTTON_SIZE = 40;

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

const modalWithOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

export const BottomModal = ({
    isVisible,
    onVisibilityChange,
    title,
    onBackArrowClick,
    children,
}: BottomModalProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const {
        animatedModalWithOverlayStyle,
        animatedModalWrapperStyle,
        closeModalAnimated,
        resetModalAnimated,
        panGestureEvent,
    } = useBottomModalAnimation({ onVisibilityChange, isVisible });

    useEffect(() => {
        if (isVisible) {
            resetModalAnimated();
        }
    }, [isVisible, resetModalAnimated]);

    const handleCloseModal = () => {
        closeModalAnimated();
    };

    return (
        <BottomModalContainer isVisible={isVisible} onClose={handleCloseModal}>
            <Animated.View
                style={[animatedModalWithOverlayStyle, applyStyle(modalWithOverlayStyle)]}
            >
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
                            {onBackArrowClick && (
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
            </Animated.View>
        </BottomModalContainer>
    );
};
