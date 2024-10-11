import { useEffect, useRef, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { GestureResponderEvent, Pressable, Dimensions } from 'react-native';

import { FlashList, FlashListProps } from '@shopify/flash-list';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { BottomSheetContainer } from './BottomSheetContainer';
import { useBottomSheetAnimation } from './useBottomSheetAnimation';
import { BottomSheetHeader } from './BottomSheetHeader';

export type BottomSheetFlashListProps<TItem> = {
    isVisible: boolean;
    isCloseDisplayed?: boolean;
    onClose: (isVisible: boolean) => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    ExtraProvider?: React.ComponentType;
    estimatedListHeight?: number;
} & FlashListProps<TItem>;

const DEFAULT_INSET_BOTTOM = 50;

const sheetWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderTopLeftRadius: utils.borders.radii.r20,
    borderTopRightRadius: utils.borders.radii.r20,
    maxHeight: '80%',
}));

const sheetContentContainerStyle = prepareNativeStyle<{
    insetBottom: number;
}>((utils, { insetBottom }) => ({
    paddingBottom: Math.max(insetBottom, utils.spacings.sp16),
    paddingHorizontal: utils.spacings.sp16,
}));

const sheetWithOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

export const BottomSheetFlashList = <TItem,>({
    isVisible,
    isCloseDisplayed = true,
    onClose,
    title,
    subtitle,
    ExtraProvider,
    estimatedListHeight = 0,
    ...flashListProps
}: BottomSheetFlashListProps<TItem>) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();
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
    });
    const panGestureRef = useRef(null);
    const scrollViewRef = useRef(null);

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
        <BottomSheetContainer
            isVisible={isVisible}
            onClose={closeSheetAnimated}
            ExtraProvider={ExtraProvider}
        >
            <Animated.View
                style={[animatedSheetWithOverlayStyle, applyStyle(sheetWithOverlayStyle)]}
            >
                <Pressable style={applyStyle(sheetWithOverlayStyle)} onPress={handlePressOutside}>
                    <PanGestureHandler
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

                            <Box
                                style={{
                                    // only estimated height is used, so we need to add some buffer to prevent unnecessary scrolling, when list is shorter than estimated
                                    height: Math.max(
                                        estimatedListHeight * 1.1,
                                        // We use this because minHeight doesn't work with `height set
                                        Dimensions.get('window').height * 0.35,
                                    ),
                                    maxHeight: '100%',
                                }}
                            >
                                <FlashList
                                    {...flashListProps}
                                    overrideProps={{
                                        simultaneousHandlers: panGestureRef,
                                    }}
                                    contentContainerStyle={applyStyle(sheetContentContainerStyle, {
                                        insetBottom,
                                    })}
                                    ref={scrollViewRef}
                                    onScroll={scrollEvent}
                                />
                            </Box>
                        </Animated.View>
                    </PanGestureHandler>
                </Pressable>
            </Animated.View>
        </BottomSheetContainer>
    );
};
