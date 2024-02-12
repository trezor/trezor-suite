import { useEffect, useMemo } from 'react';
import {
    Easing,
    interpolate,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    BlendMode,
    Canvas,
    Group,
    ImageSVG,
    LinearGradient,
    Mask,
    Rect,
    RoundedRect,
    RoundedRectProps,
    Skia,
    useSVG,
    vec,
} from '@shopify/react-native-skia';

import { icons } from '@suite-common/icons';
import { useNativeStyles } from '@trezor/styles';

const ROUNDED_CORNER_SIZE = 15;

type RoundedCornerProps = {
    x?: number;
    y?: number;
    width: number;
    height: number;
} & Omit<RoundedRectProps, 'x' | 'y' | 'width' | 'height'>;

const RoundedCorner = ({ x = 0, y = 0, width, height, ...restProps }: RoundedCornerProps) => {
    const cornerSize = 24;
    const strokeWidth = 1;

    return (
        <Mask
            mask={
                <Group>
                    <Rect
                        x={x - strokeWidth}
                        y={y - strokeWidth}
                        width={cornerSize}
                        height={cornerSize}
                    />
                    <Rect
                        x={x + strokeWidth + width - cornerSize}
                        y={y - strokeWidth}
                        width={cornerSize}
                        height={cornerSize}
                    />
                    <Rect
                        x={x + strokeWidth + width - cornerSize}
                        y={y + strokeWidth + height - cornerSize}
                        width={cornerSize}
                        height={cornerSize}
                    />
                    <Rect
                        x={x - strokeWidth}
                        y={y + strokeWidth + height - cornerSize}
                        width={cornerSize}
                        height={cornerSize}
                    />
                </Group>
            }
        >
            <RoundedRect
                x={x}
                y={y}
                width={width}
                height={height}
                r={ROUNDED_CORNER_SIZE}
                color="lightgrey"
                style="stroke"
                strokeWidth={1}
                antiAlias
                {...restProps}
            />
        </Mask>
    );
};

export const QrWithLaser = () => {
    const width = 340;
    const height = 260;
    const qrCodeWidth = 200;
    const roundedRectWidth = 224;

    const {
        utils: { colors },
    } = useNativeStyles();
    const qrCodeSvg = useSVG(icons.qrCodeImport);

    const progress = useSharedValue(0);

    const laserY = useDerivedValue(() => progress.value * height);
    const laserOpacity = useDerivedValue(() => interpolate(progress.value, [0, 0.5, 1], [0, 1, 0]));

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.bezier(0, 0, 0.3, 1) }),
            -1,
            false,
        );
    }, [progress]);

    const paint = useMemo(() => Skia.Paint(), []);
    paint.setColorFilter(
        Skia.ColorFilter.MakeBlend(Skia.Color(colors.backgroundNeutralBold), BlendMode.SrcIn),
    );

    return (
        <Canvas style={{ height, width }}>
            <Rect x={0} y={laserY} width={width} height={1} opacity={laserOpacity}>
                <LinearGradient
                    start={vec(0, 0)}
                    end={vec(width, 0)}
                    colors={[
                        colors.backgroundSurfaceElevation0,
                        'red',
                        colors.backgroundSurfaceElevation0,
                    ]}
                />
            </Rect>

            {qrCodeSvg && (
                <Group layer={paint}>
                    <ImageSVG
                        svg={qrCodeSvg}
                        x={width * 0.5 - qrCodeWidth * 0.5}
                        y={height * 0.5 - qrCodeWidth * 0.5}
                        width={qrCodeWidth}
                        height={qrCodeWidth}
                    />
                </Group>
            )}
            <RoundedCorner
                x={width * 0.5 - roundedRectWidth * 0.5}
                y={height * 0.5 - roundedRectWidth * 0.5}
                width={roundedRectWidth}
                height={roundedRectWidth}
            />
        </Canvas>
    );
};
