import { prepareNativeStyle } from '@trezor/styles-native';

export const animationStyle = prepareNativeStyle(({ borders }) => ({
    aspectRatio: 1,
    borderRadius: borders.radii.r16,
}));
