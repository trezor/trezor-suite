import { prepareNativeStyle } from '@trezor/styles-native';

// The animation dimensions are 1:3 (H:W).
const ANIMATION_HEIGHT_RATIO = 0.33;

export const animationStyle = prepareNativeStyle<{ animationWidth: number }>(
    (_, { animationWidth }) => ({
        width: animationWidth,
        height: animationWidth * ANIMATION_HEIGHT_RATIO,
    }),
);

export const linearGradientStyle = prepareNativeStyle<{ animationWidth: number }>(
    (_, { animationWidth }) => ({
        position: 'absolute',
        width: '100%',
        height: animationWidth * ANIMATION_HEIGHT_RATIO,
        top: 0,
        left: 0,
        pointerEvents: 'none',
    }),
);
