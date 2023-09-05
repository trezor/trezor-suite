import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color, CSSColor } from '@trezor/theme';

import { IconName, icons } from '../icons';

export type IconColor = Color | SharedValue<CSSColor>;

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

export const Icon = ({ name, customSize, size = 'large', color = 'iconDefault' }: IconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = customSize || iconSizes[size];

    // Paint has to be Reanimated derived value, to allow color transition animation on the UI thread.
    const paint = useDerivedValue(() => {
        const colorCode = isReanimatedSharedValue(color) ? color.value : colors[color];

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
