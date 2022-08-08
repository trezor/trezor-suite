import React, {
    ReactNode,
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { ScrollView, PanGestureHandler } from 'react-native-gesture-handler';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { BottomSheetContainer } from './BottomSheetContainer';
import { useBottomSheetAnimation } from './useBottomSheetAnimation';
import { BottomSheetHeader } from './BottomSheetHeader';

type BottomSheetProps = {
    isVisible: boolean;
    onVisibilityChange: (isVisible: boolean) => void;
    children: ReactNode;
    title: string;
};

type WrapperStyleProps = {
    insetBottom: number;
};
const sheetWrapperStyle = prepareNativeStyle<WrapperStyleProps>((utils, { insetBottom }) => ({
    backgroundColor: utils.colors.gray100,
    borderTopLeftRadius: utils.borders.radii.large,
    borderTopRightRadius: utils.borders.radii.large,
    paddingBottom: Math.max(insetBottom, utils.spacings.medium),
    height: 600,
}));

const sheetWithOverlayStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

export const BottomSheet = forwardRef<any, BottomSheetProps>(
    ({ isVisible, onVisibilityChange, title, children }, ref) => {
        const { applyStyle } = useNativeStyles();
        const insets = useSafeAreaInsets();
        const [isCloseScrollEnabled, setIsCloseScrollEnabled] = useState(true);
        const {
            animatedSheetWithOverlayStyle,
            animatedSheetWrapperStyle,
            closeSheetAnimated,
            resetSheetAnimated,
            panGestureEvent,
            scrollEvent,
            isAnimationInProgress,
        } = useBottomSheetAnimation({
            onVisibilityChange,
            isVisible,
            isCloseScrollEnabled,
            onIsCloseScrollEnabled: (isCloseScrollEnabled: boolean) => {
                setIsCloseScrollEnabled(isCloseScrollEnabled);
            },
        });
        const panGestureRef = useRef();
        const scrollViewRef = useRef();

        useImperativeHandle(ref, () => ({
            close: () => closeSheetAnimated(),
        }));

        useEffect(() => {
            if (isVisible) {
                resetSheetAnimated();
            }
        }, [isVisible, resetSheetAnimated]);

        const handleCloseSheet = () => {
            closeSheetAnimated();
        };

        return (
            <BottomSheetContainer
                isVisible={isVisible || isAnimationInProgress}
                onClose={handleCloseSheet}
            >
                <Animated.View
                    style={[animatedSheetWithOverlayStyle, applyStyle(sheetWithOverlayStyle)]}
                >
                    <Animated.View
                        style={[
                            animatedSheetWrapperStyle,
                            applyStyle(sheetWrapperStyle, {
                                insetBottom: insets.bottom,
                            }),
                        ]}
                    >
                        <BottomSheetHeader title={title} onCloseSheet={closeSheetAnimated} />
                        <ScrollView
                            ref={scrollViewRef.current}
                            waitFor={
                                isCloseScrollEnabled ? panGestureRef.current : scrollViewRef.current
                            }
                            onScroll={scrollEvent}
                        >
                            <PanGestureHandler
                                enabled={isCloseScrollEnabled}
                                ref={panGestureRef.current}
                                activeOffsetY={5}
                                failOffsetY={-5}
                                onGestureEvent={panGestureEvent}
                            >
                                <Animated.View>
                                    <Box paddingHorizontal="medium">{children}</Box>
                                </Animated.View>
                            </PanGestureHandler>
                        </ScrollView>
                    </Animated.View>
                </Animated.View>
            </BottomSheetContainer>
        );
    },
);
