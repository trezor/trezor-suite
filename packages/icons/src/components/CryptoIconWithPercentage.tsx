import React from 'react';

import { Canvas, Circle, Group, ImageSVG, Path, Skia, useSVG } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';

import { CryptoIconName, cryptoIcons } from '../icons';

const CANVAS_SIZE = 48;
const ICON_SIZE = 24;
const RADIUS = 20;

type CryptoIconProps = {
    iconName: CryptoIconName;
    percentage: number;
    percentageOffset: number;
};
export const CryptoIconWithPercentage = ({
    iconName,
    percentage,
    percentageOffset,
}: CryptoIconProps) => {
    const iconSvg = useSVG(cryptoIcons[iconName]);
    const { utils } = useNativeStyles();
    const percentageColor = utils.coinsColors[iconName] ?? utils.colors.gray500;
    const path = Skia.Path.Make();
    path.addCircle(CANVAS_SIZE / 2, CANVAS_SIZE / 2, RADIUS);

    return (
        <Canvas style={{ height: CANVAS_SIZE, width: CANVAS_SIZE }}>
            <Group
                origin={{ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 }}
                // Rotating by 25% (default offset) +  sum of percentage of all other displayed currencies. Skia uses radians as units.
                transform={[{ rotate: ((2 * Math.PI) / 100) * (-25 + percentageOffset) }]}
            >
                <Circle
                    cx={CANVAS_SIZE / 2}
                    cy={CANVAS_SIZE / 2}
                    r={RADIUS}
                    // eslint-disable-next-line react/style-prop-object
                    style="stroke"
                    strokeWidth={8}
                    color={utils.colors.gray100}
                />
                <Path
                    path={path}
                    start={0}
                    end={percentage >= 99 ? 1 : percentage / 100}
                    // eslint-disable-next-line react/style-prop-object
                    style="stroke"
                    strokeWidth={8}
                    color={percentageColor}
                    opacity={0.3}
                />
            </Group>
            {iconSvg && (
                <ImageSVG
                    svg={iconSvg}
                    x={ICON_SIZE / 2}
                    y={ICON_SIZE / 2}
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                />
            )}
        </Canvas>
    );
};
