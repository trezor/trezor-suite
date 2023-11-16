import { useEffect, useRef, useState, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { ScrollView, PanGestureHandler } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BlurredScreenOverlay } from '@suite-native/screen-overlay';

import { Box, BoxProps } from '../Box';
import { BottomSheetContainer } from './BottomSheetContainer';
import { useBottomSheetAnimation } from './useBottomSheetAnimation';
import { BottomSheetHeader } from './BottomSheetHeader';

export type BottomSheetProps = {
    isVisible: boolean;
    isCloseDisplayed?: boolean;
    onClose: (isVisible: boolean) => void;
    children: ReactNode;
    title?: string;
    subtitle?: string;
} & BoxProps;

type WrapperStyleProps = {
    insetBottom: number;
};

const DEFAULT_INSET_BOTTOM = 50;

const sheetWrapperStyle = prepareNativeStyle<WrapperStyleProps>((utils, { insetBottom }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderTopLeftRadius: utils.borders.radii.large,
    borderTopRightRadius: utils.borders.radii.large,
    paddingBottom: Math.max(insetBottom, utils.spacings.medium),
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
    ...boxProps
}: BottomSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const [isCloseScrollEnabled, setIsCloseScrollEnabled] = useState(true);
    const {
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

    const handleCloseSheet = () => {
        closeSheetAnimated();
    };

    const insetBottom = Math.max(insets.bottom, DEFAULT_INSET_BOTTOM);

    return (
        <BottomSheetContainer isVisible={isVisible} onClose={handleCloseSheet}>
            <BlurredScreenOverlay />
            <Box style={applyStyle(sheetWithOverlayStyle)}>
                <PanGestureHandler
                    enabled={isCloseScrollEnabled}
                    ref={panGestureRef.current}
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
                        <ScrollView
                            ref={scrollViewRef.current}
                            waitFor={
                                isCloseScrollEnabled ? panGestureRef.current : scrollViewRef.current
                            }
                            onScroll={scrollEvent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Animated.View>
                                <Box paddingHorizontal="medium" {...boxProps}>
                                    {children}
                                </Box>
                            </Animated.View>
                        </ScrollView>
                    </Animated.View>
                </PanGestureHandler>
            </Box>
        </BottomSheetContainer>
    );
};
