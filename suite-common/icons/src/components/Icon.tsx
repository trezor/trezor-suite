import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color, CSSColor } from '@trezor/theme';

import { icons } from '../icons';
import { getIconSize, IconProps } from '../config';

export type IconColor = Color | SharedValue<CSSColor>;

// This type-guard has to be set as 'worklet' to be executable via Reanimated on the UI thread.
const isReanimatedSharedValue = (value: IconColor): value is SharedValue<CSSColor> => {
    'worklet';

    return typeof value === 'object' && 'value' in value;
};

interface NativeIconProps extends Omit<IconProps, 'color'> {
    color?: IconColor;
}

export const Icon = ({ name, size = 'large', color = 'iconDefault' }: NativeIconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = getIconSize(size);

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
