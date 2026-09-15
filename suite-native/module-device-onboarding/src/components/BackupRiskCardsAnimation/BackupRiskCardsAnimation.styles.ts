import { getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle } from '@trezor/styles-native';

const ANIMATION_WIDTH = getScreenWidth();
const ANIMATION_HEIGHT = ANIMATION_WIDTH * 0.33; // The animation dimensions are 1:3 (H:W).

export const animationStyle = prepareNativeStyle(() => ({
    width: ANIMATION_WIDTH,
    height: ANIMATION_HEIGHT,
}));

export const linearGradientStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: ANIMATION_HEIGHT,
    top: 0,
    left: 0,
    pointerEvents: 'none',
}));
