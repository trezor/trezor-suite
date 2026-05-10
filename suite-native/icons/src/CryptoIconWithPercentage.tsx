import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import {
    Canvas,
    Circle,
    Group,
    ImageSVG,
    Path,
    Skia,
    mix,
    useSVG,
} from '@shopify/react-native-skia';

import { type CryptoIconName, cryptoIcons } from '@suite-common/icons';
import { useActiveColorScheme } from '@suite-native/theme';
import { useNativeStyles } from '@trezor/styles-native';
import { paletteV1 } from '@trezor/theme';

import { PizzaIcon, usePizzaAnimation } from './PizzaIcon';

const CANVAS_SIZE = 48;
const ICON_SIZE = 32;
const RADIUS = 21;

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
    const colorScheme = useActiveColorScheme();
    // @ts-expect-error: coinsColors uses "NetworkSymbol" type. However, here we use deprecated "CryptoIconName".
    // Not worth fixing it as this package will be removed soon.
    const percentageColor = utils.coinsColors[iconName] ?? utils.colors.contentSecondary;

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
        animationProgress.set(
            withTiming(percentage / 100, {
                duration: 2000,
                easing: Easing.ease,
            }),
        );
    }, [animationProgress, percentage]);

    return (
        <Pressable onPress={handleIconPress}>
            {/* key forces the canvas to remount on theme change so Skia picks up the new colors.
                Without this, the canvas in sometime won't repaint the colors when the
                animation has already completed and no shared values are actively changing.*/}
            <Canvas key={colorScheme} style={{ height: CANVAS_SIZE, width: CANVAS_SIZE }}>
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
                                strokeWidth={6}
                                color={utils.colors.legacyBackgroundSurfaceElevation2}
                            />
                            {/* Helps to brighten up the stroke color in dark mode */}
                            <Path
                                path={path}
                                start={0}
                                end={percentageFill}
                                style="stroke"
                                strokeWidth={6}
                                color={paletteV1.lightGray100}
                                opacity={0.15}
                            />
                            <Path
                                path={path}
                                start={0}
                                end={percentageFill}
                                style="stroke"
                                strokeWidth={6}
                                color={percentageColor}
                                opacity={0.3}
                            />
                        </Group>
                        {iconSvg && (
                            <ImageSVG
                                svg={iconSvg}
                                x={(CANVAS_SIZE - ICON_SIZE) / 2}
                                y={(CANVAS_SIZE - ICON_SIZE) / 2}
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
