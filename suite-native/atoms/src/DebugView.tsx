import { forwardRef, useLayoutEffect, useRef } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { A, G } from '@mobily/ts-belt';
import { atom, useAtom } from 'jotai';

import { useNativeStyles } from '@trezor/styles-native';

import { Text } from './Text';

const FLASH_DURATION = 300;

const isFlashOnRerenderEnabledAtom = atom(
    process.env.EXPO_PUBLIC_IS_FLASH_ON_RERENDER_ENABLED === 'true',
);
const isRerenderCountEnabledAtom = atom(
    process.env.EXPO_PUBLIC_IS_RERENDER_COUNT_ENABLED === 'true',
);

export const useDebugView = () => {
    const [isFlashOnRerenderEnabled, setIsFlashOnRerenderEnabled] = useAtom(
        isFlashOnRerenderEnabledAtom,
    );
    const [isRerenderCountEnabled, setIsRerenderCountEnabled] = useAtom(isRerenderCountEnabledAtom);

    const toggleFlashOnRerender = () => setIsFlashOnRerenderEnabled(!isFlashOnRerenderEnabled);
    const toggleRerenderCount = () => setIsRerenderCountEnabled(!isRerenderCountEnabled);

    return {
        isFlashOnRerenderEnabled,
        toggleFlashOnRerender,
        isRerenderCountEnabled,
        toggleRerenderCount,
    };
};

export const DebugView = forwardRef<View, ViewProps>(({ style, children, ...props }, ref) => {
    const { utils } = useNativeStyles();
    const { isRerenderCountEnabled } = useDebugView();
    const rerenderCount = useRef(0);

    const lastStyle: any = G.isArray(style) ? A.last(style) : style;

    const originalBackgroundColor =
        G.isObject(lastStyle) && lastStyle?.backgroundColor
            ? lastStyle.backgroundColor
            : 'transparent';

    const flashState = useSharedValue(0);

    const progress = useDerivedValue(() =>
        withTiming(flashState.value, { duration: FLASH_DURATION }, finished => {
            if (finished) {
                flashState.value = 0;
            }
        }),
    );

    useLayoutEffect(() => {
        flashState.value = flashState.value === 0 ? 1 : 0;
    });

    const rStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            [originalBackgroundColor, utils.colors.elementFillCriticalBold],
        );

        return {
            backgroundColor,
        };
    });

    return (
        <Animated.View ref={ref} style={[style, rStyle]} {...props}>
            {children}
            {isRerenderCountEnabled && (
                <View
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: -15,
                        borderColor: 'red',
                        borderWidth: 1,
                    }}
                >
                    <Text variant="body-sm">{++rerenderCount.current}</Text>
                </View>
            )}
        </Animated.View>
    );
});

DebugView.displayName = 'DebugView';
