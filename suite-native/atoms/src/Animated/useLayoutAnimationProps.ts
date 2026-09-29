import { type ViewProps } from 'react-native';
import { type AnimatedProps, useReducedMotion } from 'react-native-reanimated';

type UseLayoutAnimationPropsParams = Pick<
    AnimatedProps<ViewProps>,
    'entering' | 'exiting' | 'layout'
>;

export const useLayoutAnimationProps = ({
    entering,
    exiting,
    layout,
}: UseLayoutAnimationPropsParams) => {
    const isReducedMotion = useReducedMotion();

    // Reanimated's reduced-motion layout animations can leave views with stale geometry.
    // Omitting the builders bypasses layout animations entirely on both platforms.
    return {
        entering: isReducedMotion ? undefined : entering,
        exiting: isReducedMotion ? undefined : exiting,
        layout: isReducedMotion ? undefined : layout,
    };
};
