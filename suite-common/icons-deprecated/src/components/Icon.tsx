import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color, Colors, CSSColor } from '@trezor/theme';

import { useRerenderOnAppStateChange } from '../useRerenderOnAppState';
import { icons } from '../icons';
import { getIconSize, IconProps } from '../config';

export type IconColor = 'svgSource' | Color | CSSColor | SharedValue<CSSColor>;

// This type-guard has to be set as 'worklet' to be executable via Reanimated on the UI thread.
const isReanimatedSharedValue = (value: IconColor): value is SharedValue<CSSColor> => {
    'worklet';

    return typeof value === 'object' && 'value' in value;
};

function isCSSColor(value: any): value is CSSColor {
    'worklet';

    return (
        typeof value === 'string' &&
        (value.startsWith('#') ||
            value.startsWith('rgb(') ||
            value.startsWith('rgba(') ||
            value === 'transparent')
    );
}

const getColorCode = (color: Exclude<IconColor, 'svgSource'>, themeColors: Colors) => {
    'worklet';

    if (isReanimatedSharedValue(color)) {
        return color.value;
    }
    if (isCSSColor(color)) {
        return color;
    }

    return themeColors[color];
};

interface NativeIconProps extends Omit<IconProps, 'color'> {
    color?: IconColor;
}

export const Icon = ({ name, size = 'large', color = 'iconDefault' }: NativeIconProps) => {
    useRerenderOnAppStateChange();

    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = getIconSize(size);

    // Paint has to be Reanimated derived value, to allow color transition animation on the UI thread.
    const paint = useDerivedValue(() => {
        // If color is  set to 'svgSource', it means that the SVG file contains its own colors and we don't want to override them.
        if (color === 'svgSource') return undefined;

        const colorCode = getColorCode(color, colors);

        const freshPaint = Skia.Paint();
        freshPaint.setColorFilter(
            Skia.ColorFilter.MakeBlend(Skia.Color(colorCode), BlendMode.SrcIn),
        );

        return freshPaint;
    }, [color]);

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            <Group layer={paint}>
                {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
            </Group>
        </Canvas>
    );
};
