import {
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { useNativeStyles } from '@trezor/styles-native';

export const useAnimatedBorderStyle = (isAmountInputActive: boolean) => {
    const { utils } = useNativeStyles();
    const progress = useDerivedValue(() => withTiming(isAmountInputActive ? 1 : 0));

    return useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            progress.value,
            [0, 1],
            [utils.colors.backgroundSurfaceElevation1, utils.colors.borderInputDefault],
        ) as `rgba(${number}, ${number}, ${number}, ${number})`,
        borderWidth: interpolate(progress.value, [0, 1], [0, utils.borders.widths.large]),
        borderRadius: utils.borders.radii.r16,
    }));
};
