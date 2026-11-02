import { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Icon } from '@suite-native/icons';

import { AnimatedBox } from './AnimatedBox';

const ANIMATION_DURATION = 200;

type AnimatedChevronProps = {
    isExpanded: boolean | SharedValue<boolean>;
};

export const AnimatedChevron = ({ isExpanded }: AnimatedChevronProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const expanded = typeof isExpanded === 'boolean' ? isExpanded : isExpanded.value;

        return {
            transform: [
                {
                    rotate: withTiming(expanded ? '-180deg' : '0deg', {
                        duration: ANIMATION_DURATION,
                    }),
                },
            ],
        };
    });

    return (
        <AnimatedBox style={animatedStyle}>
            <Icon name="caretDown" size="mediumLarge" />
        </AnimatedBox>
    );
};
