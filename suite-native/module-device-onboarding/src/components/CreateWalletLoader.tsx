import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { Canvas, Group, RoundedRect } from '@shopify/react-native-skia';

import { isDetoxTestBuild } from '@suite-native/config';
import { getScreenWidth } from '@trezor/env-utils';
import { useNativeStyles } from '@trezor/styles';

const LOADER_HEIGHT = 4;
const LOADER_WIDTH = getScreenWidth() - 32;
export const LOADER_DURATION = 4000;

export const CreateWalletLoader = () => {
    const { utils } = useNativeStyles();

    const animationProgress = useSharedValue(0);

    useEffect(() => {
        animationProgress.value = withTiming(LOADER_WIDTH, {
            // In Detox test environment we must shorten duration to prevent test hanging
            duration: isDetoxTestBuild() ? 1 : LOADER_DURATION,
            easing: Easing.ease,
        });
    }, [animationProgress]);

    return (
        <Canvas
            style={{
                width: LOADER_WIDTH,
                height: LOADER_HEIGHT,
            }}
        >
            <Group>
                <RoundedRect
                    x={0}
                    y={0}
                    width={LOADER_WIDTH}
                    height={LOADER_HEIGHT}
                    r={5}
                    color={utils.colors.borderElevation0}
                />
                <RoundedRect
                    x={0}
                    y={0}
                    width={animationProgress}
                    height={LOADER_HEIGHT}
                    color={utils.colors.backgroundSecondaryDefault}
                    r={5}
                />
            </Group>
        </Canvas>
    );
};
