import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { clamp } from '@trezor/utils';

export type ProgressBarProps = {
    value: number;
    max?: number;
};

const trackStyle = prepareNativeStyle(utils => ({
    height: 6,
    borderRadius: utils.borders.radii.r4,
    backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevation1,
    overflow: 'hidden',
}));

const fillStyle = prepareNativeStyle((utils, { ratio }: { ratio: number }) => ({
    height: '100%',
    width: `${clamp(ratio * 100, 0, 100).toFixed(0)}%` as `${number}%`,
    backgroundColor: utils.colors.contentBrand,
    borderRadius: utils.borders.radii.r4,
}));

export const ProgressBar = ({ value, max = 100 }: ProgressBarProps) => {
    const { applyStyle } = useNativeStyles();
    const ratio = max > 0 ? value / max : 0;

    return (
        <View style={applyStyle(trackStyle)}>
            <View style={applyStyle(fillStyle, { ratio })} />
        </View>
    );
};
