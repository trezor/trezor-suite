import { type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, Card } from '@suite-native/atoms';
import { useAnimatedBorderStyle } from '@suite-native/trading-atoms';

export type TradingCardProps = {
    isAmountInputActive?: boolean;
    testID?: string;
    shouldAnimateEntering?: boolean;
};

export const TradingCard = ({
    isAmountInputActive = false,
    shouldAnimateEntering,
    testID,
    children,
}: PropsWithChildren<TradingCardProps>) => {
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);

    // on android fade animation looks ugly on view with shadows, better to skip it
    const enteringAnimation = shouldAnimateEntering && Platform.OS === 'ios' ? FadeIn : undefined;

    return (
        <AnimatedBox entering={enteringAnimation} layout={LinearTransition}>
            <Card noPadding>
                <AnimatedBox style={animatedStyle} testID={testID}>
                    {children}
                </AnimatedBox>
            </Card>
        </AnimatedBox>
    );
};
