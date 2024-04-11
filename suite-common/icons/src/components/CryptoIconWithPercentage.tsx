import { useEffect } from 'react';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable } from 'react-native';

import {
    Canvas,
    Circle,
    Group,
    ImageSVG,
    mix,
    Path,
    Skia,
    useSVG,
} from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';

import { CryptoIconName, cryptoIcons } from '../icons';
import { PizzaIcon, usePizzaAnimation } from './PizzaIcon';

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
    const percentageColor = utils.coinsColors[iconName] ?? utils.colors.textSubdued;

    const path = Skia.Path.Make();
    path.addCircle(CANVAS_SIZE / 2, CANVAS_SIZE / 2, RADIUS);

    const animationProgress = useSharedValue(0);

    const { handleChangePizza, displayedPizzaIndex, isPizzaDay } = usePizzaAnimation({
        percentage,
        animationProgress,
    });

    const isBitcoin = iconName === 'btc';
    const isPizzaIconSelected = displayedPizzaIndex !== 0;

    const handleIconPress = () => {
        // trigger animation only for bitcoin
        if (isBitcoin) handleChangePizza();
    };

    // It's neccessary to clamp the value to 0.999 because Skia doesn't support values greater than 1 as end value.
    // And due to javascript floating point precision, 1 is not exactly 1 but little bit more sometimes.
    const percentageFill = useDerivedValue(() => mix(animationProgress.value, 0, 0.999));

    useEffect(() => {
        animationProgress.value = withTiming(percentage / 100, {
            duration: 2000,
            easing: Easing.ease,
        });
    }, [animationProgress, percentage]);

    return (
        <Pressable onPress={handleIconPress}>
            <Canvas style={{ height: CANVAS_SIZE, width: CANVAS_SIZE }}>
                {/* show pizza instead of BTC icon on pizza day. */}
                {isPizzaDay && isBitcoin && isPizzaIconSelected ? (
                    <PizzaIcon
                        degreePercentageOffset={percentageOffset}
                        animationProgress={percentageFill}
                        displayedPizzaIndex={displayedPizzaIndex}
                    />
                ) : (
                    <>
                        <Group
                            origin={{ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 }}
                            // Rotating by 25% (default offset) +  sum of percentage of all other displayed currencies. Skia uses radians as units.
                            transform={[
                                { rotate: ((2 * Math.PI) / 100) * (-25 + percentageOffset) },
                            ]}
                        >
                            <Circle
                                cx={CANVAS_SIZE / 2}
                                cy={CANVAS_SIZE / 2}
                                r={RADIUS}
                                style="stroke"
                                strokeWidth={8}
                                color={utils.colors.backgroundSurfaceElevation2}
                            />
                            <Path
                                path={path}
                                start={0}
                                end={percentageFill}
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
                    </>
                )}
            </Canvas>
        </Pressable>
    );
};
