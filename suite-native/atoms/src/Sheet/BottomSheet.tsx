import { ReactNode, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    GestureResponderEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
} from 'react-native';
import { PanGestureHandler, ScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScrollDivider } from '@suite-native/navigation';
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
    footer?: ReactNode;
    maxHeight?: `${number}%`;
} & BoxProps;

type WrapperStyleProps = {
    insetBottom: number;
    maxHeight: `${number}%`;
};

const DEFAULT_INSET_BOTTOM = Platform.OS === 'android' ? 48 : 0;

const sheetWrapperStyle = prepareNativeStyle<WrapperStyleProps>(
    (utils, { insetBottom, maxHeight }) => ({
        backgroundColor: utils.colors.backgroundSurfaceElevation0,
        borderTopLeftRadius: utils.borders.radii.r20,
        borderTopRightRadius: utils.borders.radii.r20,
        paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
        maxHeight,
    }),
);

const sheetWithOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

export type BottomSheetHandle = {
    closeWithAnimation: () => void;
};

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
    (
        {
            isVisible,
            onClose,
            title,
            subtitle,
            children,
            footer,
            isScrollable = true,
            isCloseDisplayed = true,
            maxHeight = '90%',
            ...boxProps
        },
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();
        const insets = useSafeAreaInsets();
        const [isCloseScrollEnabled, setIsCloseScrollEnabled] = useState(true);
        const {
            animatedSheetWithOverlayStyle,
            animatedSheetWrapperStyle,
            closeSheetAnimated,
            openSheetAnimated,
            panGestureEvent,
            scrollEvent: handleBottomSheetScroll,
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

        useImperativeHandle(ref, () => ({
            closeWithAnimation: closeSheetAnimated,
        }));

        useEffect(() => {
            if (isVisible) {
                openSheetAnimated();
            }
        }, [isVisible, openSheetAnimated]);

        const handlePressOutside = (event: GestureResponderEvent) => {
            if (event.target === event.currentTarget) closeSheetAnimated();
        };

        const insetBottom = Math.max(insets.bottom, DEFAULT_INSET_BOTTOM);
        const { scrollDivider, handleScroll: handleScrollDivider } = useScrollDivider();

        const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            handleScrollDivider(event);
            handleBottomSheetScroll(event);
        };

        return (
            <BottomSheetContainer isVisible={isVisible} onClose={closeSheetAnimated}>
                <Animated.View
                    style={[animatedSheetWithOverlayStyle, applyStyle(sheetWithOverlayStyle)]}
                >
                    <Pressable
                        style={applyStyle(sheetWithOverlayStyle)}
                        onPress={handlePressOutside}
                    >
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
                                        maxHeight,
                                    }),
                                ]}
                            >
                                <BottomSheetHeader
                                    title={title}
                                    subtitle={subtitle}
                                    isCloseDisplayed={isCloseDisplayed}
                                    onCloseSheet={closeSheetAnimated}
                                    scrollDivider={scrollDivider}
                                />
                                {isScrollable ? (
                                    <ScrollView
                                        ref={scrollViewRef.current}
                                        waitFor={
                                            isCloseScrollEnabled
                                                ? panGestureRef.current
                                                : scrollViewRef.current
                                        }
                                        onScroll={handleScroll}
                                        keyboardShouldPersistTaps="handled"
                                        testID="@bottom-sheet/scroll-view"
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
                                {footer}
                            </Animated.View>
                        </PanGestureHandler>
                    </Pressable>
                </Animated.View>
            </BottomSheetContainer>
        );
    },
);
