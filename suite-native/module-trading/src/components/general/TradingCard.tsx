import { type ReactNode } from 'react';
import { type AnimatedProps, LinearTransition } from 'react-native-reanimated';

import { AnimatedBorderCard, AnimatedBox } from '@suite-native/atoms';
import { useAnimatedBorderStyle } from '@suite-native/trading-atoms';

export type TradingCardProps = {
    isAmountInputActive?: boolean;
    entering?: AnimatedProps<any>['entering'];
    testID?: string;
    children: ReactNode;
};

export const TradingCard = ({
    isAmountInputActive = false,
    entering,
    testID,
    children,
}: TradingCardProps) => {
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);

    return (
        <AnimatedBox entering={entering} layout={LinearTransition}>
            <AnimatedBorderCard style={[animatedStyle]} noPadding testID={testID}>
                {children}
            </AnimatedBorderCard>
        </AnimatedBox>
    );
};
