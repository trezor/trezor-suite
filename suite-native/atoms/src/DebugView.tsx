import { useRef } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { atom, useAtom } from 'jotai';
import { A, G } from '@mobily/ts-belt';

import { useNativeStyles } from '@trezor/styles';

import { Text } from './Text';

const FLASH_DURATION = 300;
// set these to true if you are debugging rerenders locally
const FLASH_ON_RERENDER = false;
const RERENDER_COUNT_ENABLED = false;

const isFlashOnRerenderEnabledAtom = atom(FLASH_ON_RERENDER);
const isRerenderCountEnabledAtom = atom(RERENDER_COUNT_ENABLED);

export const useDebugView = () => {
    const [isFlashOnRerenderEnabled, setIsFlashOnRerenderEnabled] = useAtom(
        isFlashOnRerenderEnabledAtom,
    );
    const [isRerenderCountEnabled, setIsRerenderCountEnabled] = useAtom(isRerenderCountEnabledAtom);

    const toggleFlashOnRerender = () => setIsFlashOnRerenderEnabled(!isFlashOnRerenderEnabled);
    const toggleRerenderCount = () => setIsRerenderCountEnabled(!isRerenderCountEnabled);

    return {
        isFlashOnRerenderEnabled,
        toggleRerenderCount,
        isRerenderCountEnabled,
        toggleFlashOnRerender,
    };
};

export const DebugView = ({ style, children, ...props }: ViewProps) => {
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

    flashState.value = flashState.value === 0 ? 1 : 0;

    const rStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            [originalBackgroundColor, utils.colors.backgroundAlertRedBold],
        );

        return {
            backgroundColor,
        };
    });

    return (
        <Animated.View style={[style, rStyle]} {...props}>
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
                    <Text variant="hint">{++rerenderCount.current}</Text>
                </View>
            )}
        </Animated.View>
    );
};
