import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { Canvas, Group, RoundedRect } from '@shopify/react-native-skia';

import { isDetoxTestBuild } from '@suite-native/config';
import { useNativeStyles } from '@trezor/styles-native';

const LOADER_HEIGHT = 4;
const LOADER_HORIZONTAL_MARGIN = 32;
export const LOADER_DURATION = 4000;

export const CreateWalletLoader = () => {
    const { utils } = useNativeStyles();
    const { width: windowWidth } = useWindowDimensions();

    const loaderWidth = windowWidth - LOADER_HORIZONTAL_MARGIN;
    const animationProgress = useSharedValue(0);
    const animatedLoaderWidth = useDerivedValue(
        () => animationProgress.value * loaderWidth,
        [loaderWidth],
    );

    useEffect(() => {
        animationProgress.value = withTiming(1, {
            // In Detox test environment we must shorten duration to prevent test hanging
            duration: isDetoxTestBuild() ? 1 : LOADER_DURATION,
            easing: Easing.ease,
        });
    }, [animationProgress]);

    return (
        <Canvas
            style={{
                width: loaderWidth,
                height: LOADER_HEIGHT,
            }}
        >
            <Group>
                <RoundedRect
                    x={0}
                    y={0}
                    width={loaderWidth}
                    height={LOADER_HEIGHT}
                    r={5}
                    color={utils.colors.borderNeutral}
                />
                <RoundedRect
                    x={0}
                    y={0}
                    width={animatedLoaderWidth}
                    height={LOADER_HEIGHT}
                    color={utils.colors.contentBrand}
                    r={5}
                />
            </Group>
        </Canvas>
    );
};
