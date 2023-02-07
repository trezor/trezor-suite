import React from 'react';

import {
    Canvas,
    Group,
    ImageSVG,
    LinearGradient,
    Mask,
    Rect,
    RoundedRect,
    RoundedRectProps,
    useComputedValue,
    useLoop,
    useSVG,
    vec,
} from '@shopify/react-native-skia';

import { icons } from '@trezor/icons';
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
                // eslint-disable-next-line react/style-prop-object
                style="stroke"
                strokeWidth={1}
                antiAlias
                {...restProps}
            />
        </Mask>
    );
};

export const QrWithLaser = () => {
    const width = 300;
    const height = 330;
    const qrCodeWidth = 150;
    const roundedRectWidth = 222;

    const {
        utils: { colors },
    } = useNativeStyles();
    const qrCodeSvg = useSVG(icons.qrCodeImport);

    const loop = useLoop();
    const laserY = useComputedValue(() => loop.current * height, [loop]);

    return (
        <Canvas style={{ height, width, borderColor: 'red', borderWidth: 0 }}>
            <Rect x={0} y={laserY} width={342} height={1}>
                <LinearGradient
                    start={vec(0, 0)}
                    end={vec(width, 0)}
                    colors={[colors.gray100, 'red', colors.gray100]}
                />
            </Rect>
            {qrCodeSvg && (
                <ImageSVG
                    svg={qrCodeSvg}
                    x={width * 0.5 - qrCodeWidth * 0.5}
                    y={height * 0.5 - qrCodeWidth * 0.5}
                    width={qrCodeWidth}
                    height={qrCodeWidth}
                />
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
