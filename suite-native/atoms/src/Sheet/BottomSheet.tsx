import { ReactNode, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Platform, Pressable } from 'react-native';
import { PanGestureHandler, ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from '../Box';
import { BottomSheetContainer } from './BottomSheetContainer';
import { BottomSheetHeader } from './BottomSheetHeader';
import { useBottomSheetAnimation } from './useBottomSheetAnimation';

export type BottomSheetProps = {
    isVisible: boolean;
    isCloseDisplayed?: boolean;
    onClose: (isVisible: boolean) => void;
    children: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
    isScrollable?: boolean;
} & BoxProps;

type WrapperStyleProps = {
    insetBottom: number;
};

const DEFAULT_INSET_BOTTOM = Platform.OS === 'android' ? 48 : 0;

const sheetWrapperStyle = prepareNativeStyle<WrapperStyleProps>((utils, { insetBottom }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderTopLeftRadius: utils.borders.radii.r20,
    borderTopRightRadius: utils.borders.radii.r20,
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
    maxHeight: '90%',
}));

const sheetWithOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

export const BottomSheet = ({
    isVisible,
    isCloseDisplayed = true,
    onClose,
    title,
    subtitle,
    children,
    isScrollable = true,
    ...boxProps
}: BottomSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const [isCloseScrollEnabled, setIsCloseScrollEnabled] = useState(true);
    const {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
        panGestureEvent,
        scrollEvent,
    } = useBottomSheetAnimation({
        onClose,
        isVisible,
        isCloseScrollEnabled,
        setIsCloseScrollEnabled: (isScrollEnabled: boolean) => {
            setIsCloseScrollEnabled(isScrollEnabled);
        },
    });
    const panGestureRef = useRef();
    const scrollViewRef = useRef();

    useEffect(() => {
        if (isVisible) {
            openSheetAnimated();
        }
    }, [isVisible, openSheetAnimated]);

    const handlePressOutside = (event: GestureResponderEvent) => {
        if (event.target === event.currentTarget) closeSheetAnimated();
    };

    const insetBottom = Math.max(insets.bottom, DEFAULT_INSET_BOTTOM);

    return (
        <BottomSheetContainer isVisible={isVisible} onClose={closeSheetAnimated}>
            <Animated.View
                style={[animatedSheetWithOverlayStyle, applyStyle(sheetWithOverlayStyle)]}
            >
                <Pressable style={applyStyle(sheetWithOverlayStyle)} onPress={handlePressOutside}>
                    <PanGestureHandler
                        enabled={isCloseScrollEnabled}
                        ref={panGestureRef}
                        activeOffsetY={5}
                        failOffsetY={-5}
                        onGestureEvent={panGestureEvent}
                    >
                        <Animated.View
                            style={[
                                animatedSheetWrapperStyle,
                                applyStyle(sheetWrapperStyle, {
                                    insetBottom,
                                }),
                            ]}
                        >
                            <BottomSheetHeader
                                title={title}
                                subtitle={subtitle}
                                isCloseDisplayed={isCloseDisplayed}
                                onCloseSheet={closeSheetAnimated}
                            />
                            {isScrollable ? (
                                <ScrollView
                                    ref={scrollViewRef.current}
                                    waitFor={
                                        isCloseScrollEnabled
                                            ? panGestureRef.current
                                            : scrollViewRef.current
                                    }
                                    onScroll={scrollEvent}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <Animated.View>
                                        <Box paddingHorizontal="sp16" {...boxProps}>
                                            {children}
                                        </Box>
                                    </Animated.View>
                                </ScrollView>
                            ) : (
                                <Box {...boxProps} style={{ height: '100%' }}>
                                    {children}
                                </Box>
                            )}
                        </Animated.View>
                    </PanGestureHandler>
                </Pressable>
            </Animated.View>
        </BottomSheetContainer>
    );
};
