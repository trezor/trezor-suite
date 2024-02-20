import { useEffect, useMemo } from 'react';
import {
    interpolate,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { FitBox, Group, Path, Skia, rect } from '@shopify/react-native-skia';

const DEFAULT_STROKE_WIDTH = 2;

const defaultPathFigma = Skia.Path.MakeFromSVGString(
    'M0 156.648L7.5508 114.219C7.71044 113.322 8.88859 113.089 9.37848 113.857L14.9293 122.561C15.3715 123.255 16.4151 123.147 16.7072 122.379L24 103.183L31.1353 89.1968C31.5013 88.4792 32.5222 88.4669 32.9055 89.1753L39.0696 100.567C39.4578 101.285 40.4952 101.261 40.8497 100.526L47.4036 86.9454C47.6984 86.3347 48.5026 86.1882 48.9938 86.6558L54.5785 91.9728C55.1703 92.5362 56.1513 92.1906 56.2593 91.3806L63.0688 40.2817C63.2217 39.1343 64.8767 39.1203 65.0489 40.265L70.9538 79.509C71.1259 80.6532 72.7801 80.6399 72.9338 79.493L78.6798 36.6061C78.84 35.4109 80.5876 35.4685 80.6687 36.6717L87.684 140.732C87.7566 141.808 89.2481 142.022 89.6204 141.009L95.8449 124.067C95.9436 123.799 96.1524 123.585 96.4186 123.481L103.095 120.864C103.599 120.666 104.169 120.905 104.38 121.403L110.639 136.125C111.032 137.049 112.389 136.882 112.547 135.891L119.932 89.5015C119.975 89.2273 120.131 88.9836 120.361 88.8287L126.629 84.6166C127.253 84.1974 128.099 84.5902 128.181 85.3371L134.915 146.5C135.047 147.698 136.795 147.683 136.905 146.482L143.154 78.3459C143.263 77.1538 144.995 77.1259 145.142 78.3139L152 133.502L158.806 187.521C158.956 188.712 160.695 188.676 160.794 187.479L167.987 101.272C167.996 101.172 168.019 101.075 168.056 100.982L176 81.2294L182.617 57.4485C182.911 56.389 184.452 56.5124 184.574 57.6053L191.255 117.316C191.383 118.458 193.021 118.518 193.232 117.389L200 81.2294L207.307 50.465C207.529 49.5303 208.813 49.416 209.197 50.2968L215.959 65.8234C215.986 65.886 216.007 65.9513 216.021 66.0181L223.839 103.421C223.934 103.873 224.324 104.201 224.785 104.216L231.077 104.428C231.598 104.445 232.045 104.059 232.104 103.541L240 33.9176L246.852 2.29785C247.087 1.21317 248.65 1.26161 248.818 2.35877L255.294 44.7941C255.457 45.8602 256.959 45.9491 257.247 44.9096L262.498 25.9103C262.796 24.833 264.368 24.9814 264.459 26.0953L271.72 115.043C271.801 116.041 273.136 116.313 273.602 115.427L279.009 105.131C279.403 104.381 280.493 104.43 280.818 105.213L286.443 118.76C286.844 119.724 288.269 119.506 288.363 118.465L295.6 37.7561C295.695 36.6916 297.169 36.4989 297.535 37.503L303.95 55.1064C303.983 55.1975 304.029 55.2832 304.087 55.361L311.833 65.772C311.942 65.9188 312.009 66.0927 312.026 66.2749L319.976 150.42C319.992 150.586 320.049 150.747 320.143 150.885L326.966 160.986C327.411 161.644 328.408 161.546 328.716 160.814L335.97 143.576C335.99 143.529 336.013 143.483 336.04 143.44L343.906 130.665C343.968 130.564 344.048 130.475 344.141 130.402L351.797 124.399C351.93 124.295 352.035 124.159 352.101 124.003L359.35 106.952C359.645 106.258 360.572 106.128 361.047 106.713L368 115.28L375.53 122.449C375.816 122.721 376.235 122.8 376.6 122.65L383.513 119.81C383.818 119.685 384.042 119.418 384.111 119.096L390 91.8327',
);

export const LoadingLine = ({
    width,
    height,
    color,
    isStatic = true,
}: {
    width: number;
    height: number;
    color: string;
    isStatic?: boolean;
}) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        if (!isStatic) {
            progress.value = 0;
            progress.value = withRepeat(withTiming(2, { duration: 4000 }), -1);
        } else {
            progress.value = 1;
        }
    }, [progress, isStatic]);

    const animationClipRect = useDerivedValue(() => {
        if (progress.value < 1) {
            return rect(0, 0, width * progress.value, height);
        }
        const x = interpolate(progress.value, [1, 2], [0, width]);

        return rect(x, 0, width, height);
    });

    const compensatedStrokeWidth = useMemo(() => {
        if (!defaultPathFigma) return DEFAULT_STROKE_WIDTH;
        // Fitbox will scale the path to fit the screen, so we need to compensate for the stroke width
        const defaultPathBounds = defaultPathFigma.getBounds();
        const strokeChangeRatio = defaultPathBounds.width / width;

        return DEFAULT_STROKE_WIDTH * strokeChangeRatio;
    }, [width]);

    const resizeRect = useMemo(
        () =>
            // Path has hardcoded width and height, so we need to resize for different screens
            rect(0, 0, width, height),
        [width, height],
    );

    if (!defaultPathFigma) {
        return null;
    }

    return (
        <Group clip={animationClipRect} opacity={0.3}>
            <FitBox src={defaultPathFigma.getBounds()} dst={resizeRect} fit="fill">
                <Path
                    path={defaultPathFigma}
                    color={color}
                    style="stroke"
                    strokeJoin="round"
                    strokeWidth={compensatedStrokeWidth}
                />
            </FitBox>
        </Group>
    );
};
