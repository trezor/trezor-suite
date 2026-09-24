import { type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import {
    KeyboardStickyView,
    useKeyboardState,
    useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const TOOLBAR_BOTTOM_OFFSET = 32;
const VISIBILITY_ANIMATION_DURATION = 200;

const keyboardToolbarStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -TOOLBAR_BOTTOM_OFFSET,
}));

const toolbarContentStyle = prepareNativeStyle<{ hasPadding: boolean }>(
    ({ colors, borders, spacings }, { hasPadding }) => ({
        paddingBottom: hasPadding ? TOOLBAR_BOTTOM_OFFSET + spacings.sp12 : TOOLBAR_BOTTOM_OFFSET,
        paddingTop: hasPadding ? spacings.sp12 : 0,
        paddingHorizontal: hasPadding ? spacings.sp16 : 0,
        backgroundColor: colors.surfaceFillFixed,
        borderTopLeftRadius: borders.radii.r20,
        borderTopRightRadius: borders.radii.r20,
    }),
);

type KeyboardToolbarProps = {
    hasPadding?: boolean;
    isVisible?: boolean;
    onHeightChange?: (height: number) => void;
};

export const KeyboardToolbar = ({
    children,
    onHeightChange,
    hasPadding = true,
    isVisible = true,
}: PropsWithChildren<KeyboardToolbarProps>) => {
    const [height, setHeight] = useState(0);
    const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const hiddenProgress = useSharedValue(isVisible ? 0 : 1);
    const { applyStyle } = useNativeStyles();
    const isInteractive = isVisible && isKeyboardVisible && height > 0;

    useEffect(() => {
        hiddenProgress.value = withTiming(isVisible ? 0 : 1, {
            duration: VISIBILITY_ANIMATION_DURATION,
        });
    }, [hiddenProgress, isVisible]);

    const animatedVisibilityStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: hiddenProgress.value * (height + tabBarHeight - keyboardHeight.value),
            },
        ],
    }));

    const handleLayout = (event: LayoutChangeEvent) => {
        const layoutHeight = event.nativeEvent.layout.height;
        setHeight(layoutHeight);
        onHeightChange?.(layoutHeight);
    };

    return (
        <KeyboardStickyView
            style={applyStyle(keyboardToolbarStyle)}
            offset={{ closed: height + tabBarHeight, opened: tabBarHeight }}
            onLayout={handleLayout}
            pointerEvents={isInteractive ? 'auto' : 'none'}
            accessibilityElementsHidden={!isInteractive}
            importantForAccessibility={isInteractive ? 'auto' : 'no-hide-descendants'}
            testID="@keyboard/toolbar"
        >
            <Animated.View
                style={[applyStyle(toolbarContentStyle, { hasPadding }), animatedVisibilityStyle]}
            >
                {children}
            </Animated.View>
        </KeyboardStickyView>
    );
};
