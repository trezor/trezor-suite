import React, { ReactNode, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';
import { BottomSheetContainer } from './BottomSheetContainer';
import { useBottomSheetAnimation } from './useBottomSheetAnimation';

type BottomSheetProps = {
    isVisible: boolean;
    onVisibilityChange: (isVisible: boolean) => void;
    children: ReactNode;
    title: string;
    onBackArrowClick?: () => void;
};

type WrapperStyleProps = {
    insetBottom: number;
};

const sheetWrapperStyle = prepareNativeStyle<WrapperStyleProps>((utils, { insetBottom }) => ({
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

const sheetHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: utils.spacings.medium,
}));

const sheetWithOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

export const BottomSheet = ({
    isVisible,
    onVisibilityChange,
    title,
    onBackArrowClick,
    children,
}: BottomSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        resetSheetAnimated,
        panGestureEvent,
    } = useBottomSheetAnimation({ onVisibilityChange, isVisible });

    useEffect(() => {
        if (isVisible) {
            resetSheetAnimated();
        }
    }, [isVisible, resetSheetAnimated]);

    const handleCloseSheet = () => {
        closeSheetAnimated();
    };

    return (
        <BottomSheetContainer isVisible={isVisible} onClose={handleCloseSheet}>
            <Animated.View
                style={[animatedSheetWithOverlayStyle, applyStyle(sheetWithOverlayStyle)]}
            >
                <PanGestureHandler onGestureEvent={panGestureEvent}>
                    <Animated.View
                        style={[
                            animatedSheetWrapperStyle,
                            applyStyle(sheetWrapperStyle, {
                                insetBottom: insets.bottom,
                            }),
                        ]}
                    >
                        <Box style={applyStyle(sheetHeaderStyle)}>
                            {onBackArrowClick && (
                                <TouchableOpacity onPress={onBackArrowClick}>
                                    <Icon name="chevronLeft" />
                                </TouchableOpacity>
                            )}
                            <Text variant="titleSmall">{title}</Text>
                            <TouchableOpacity
                                onPress={handleCloseSheet}
                                style={applyStyle(closeButtonStyle)}
                            >
                                <Icon name="close" />
                            </TouchableOpacity>
                        </Box>
                        <Box paddingHorizontal="medium">{children}</Box>
                    </Animated.View>
                </PanGestureHandler>
            </Animated.View>
        </BottomSheetContainer>
    );
};
