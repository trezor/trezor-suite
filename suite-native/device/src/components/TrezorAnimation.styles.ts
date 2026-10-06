import { prepareNativeStyle } from '@trezor/styles-native';

const ANIMATION_WIDTH = 2000;
const ANIMATION_HEIGHT = 2667;

export const animationStyle = prepareNativeStyle(({ borders }) => ({
    flexShrink: 1,
    alignSelf: 'center',
    width: '100%',
    aspectRatio: ANIMATION_WIDTH / ANIMATION_HEIGHT,
    borderRadius: borders.radii.r16,
}));
