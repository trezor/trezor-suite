/* eslint-disable global-require */
import { Easing, SharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useState } from 'react';

import { useImage, mix, rect, Skia, Group, Image } from '@shopify/react-native-skia';

type PIZZA_INDEX = 1 | 2 | 3;

const PIZZA_SIZE = 46;

const isPizzaDay = () => {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    // May 22nd
    return month === 4 && day > 21 && day < 23;
};

export const usePizzaAnimation = ({
    percentage,
    animationProgress,
}: {
    percentage: number;
    animationProgress: SharedValue<number>;
}) => {
    const [displayedPizzaIndex, setDisplayedPizzaIndex] = useState<0 | PIZZA_INDEX>(1);

    const handleChangePizza = () => {
        animationProgress.value = 0;
        setDisplayedPizzaIndex(currentPizzaIndex => ((currentPizzaIndex + 1) % 4) as PIZZA_INDEX);
        animationProgress.value = withTiming(percentage / 100, {
            duration: 2000,
            easing: Easing.ease,
        });
    };

    return { handleChangePizza, displayedPizzaIndex, isPizzaDay: isPizzaDay() };
};

const PizzaImageMap = {
    1: require('./pizza1.png'),
    2: require('./pizza2.png'),
    3: require('./pizza3.png'),
} as const satisfies Record<PIZZA_INDEX, string>;

export const PizzaIcon = ({
    degreePercentageOffset,
    animationProgress,
    displayedPizzaIndex,
}: {
    degreePercentageOffset: number;
    animationProgress: SharedValue<number>;
    displayedPizzaIndex: 1 | 2 | 3;
}) => {
    const pizzaImage = useImage(PizzaImageMap[displayedPizzaIndex]);

    const animatedPath = useDerivedValue(() => {
        const percentageRadius = mix(animationProgress.value, 0, 0.999);

        const startAnglePosition = degreePercentageOffset * 360 + 270;
        const sweepAngle = percentageRadius * 360;
        const cx = PIZZA_SIZE / 2;
        const cy = PIZZA_SIZE / 2;
        const radius = PIZZA_SIZE / 2;

        const startX = cx + radius * Math.cos((startAnglePosition * Math.PI) / 180);
        const startY = cy + radius * Math.sin((startAnglePosition * Math.PI) / 180);

        const oval = rect(cx - radius, cy - radius, cx + radius, cy + radius);

        const path = Skia.Path.Make();

        path.moveTo(cx, cy)
            .lineTo(startX, startY)
            .arcToOval(oval, startAnglePosition, sweepAngle, false)
            .close();

        return path;
    });

    return (
        <Group clip={animatedPath}>
            <Image
                image={pizzaImage}
                fit="contain"
                x={0}
                y={0}
                width={PIZZA_SIZE}
                height={PIZZA_SIZE}
            />
        </Group>
    );
};
