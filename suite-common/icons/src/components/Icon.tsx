import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color, Colors, CSSColor } from '@trezor/theme';

import { IconName, icons } from '../icons';

export type IconColor = 'svgSource' | Color | CSSColor | SharedValue<CSSColor>;

type IconProps = {
    name: IconName;
    size?: IconSize;
    customSize?: number;
    color?: IconColor;
};

export const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
    extraLarge: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

// This type-guard has to be set as 'worklet' to be executable via Reanimated on the UI thread.
const isReanimatedSharedValue = (value: IconColor): value is SharedValue<CSSColor> => {
    'worklet';

    return typeof value === 'object' && 'value' in value;
};

export function isCSSColor(value: any): value is CSSColor {
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

export const Icon = ({ name, customSize, size = 'large', color = 'iconDefault' }: IconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = customSize || iconSizes[size];

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
