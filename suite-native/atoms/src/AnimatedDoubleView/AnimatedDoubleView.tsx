import { useCallback, useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import {
    ANIMATION_DURATION,
    AnimatedViewWrapper,
    type AnimatedViewWrapperProps,
} from './AnimatedViewWrapper';
import { SwitchViewsButton } from './SwitchViewsButton';

export type { RenderViewProps } from './AnimatedViewWrapper';

export type ActiveView = 'primary' | 'secondary';

export type AnimatedDoubleViewProps = {
    renderPrimary: AnimatedViewWrapperProps['renderView'];
    renderSecondary: AnimatedViewWrapperProps['renderView'];
    onViewSwitch?: (activeView: ActiveView) => void;
    switchLabel?: string;
};

export const ANIMATED_DOUBLE_VIEW_SWITCH_ANIMATION_DURATION = ANIMATION_DURATION;
export const ANIMATED_DOUBLE_VIEW_WRAPPER_HEIGHT = 108;

const viewsWrapperStyle = prepareNativeStyle(() => ({
    height: ANIMATED_DOUBLE_VIEW_WRAPPER_HEIGHT,
    justifyContent: 'space-between',
}));

const noop = () => {};

export const AnimatedDoubleView = ({
    renderPrimary,
    renderSecondary,
    onViewSwitch = noop,
    switchLabel,
}: AnimatedDoubleViewProps) => {
    const { applyStyle } = useNativeStyles();

    const [activeView, setActiveView] = useState<ActiveView>('primary');

    const handleViewSwitch = useCallback(() => {
        const nextActiveView = activeView === 'primary' ? 'secondary' : 'primary';

        setActiveView(nextActiveView);
        onViewSwitch(nextActiveView);
    }, [onViewSwitch, activeView]);

    return (
        <Animated.View layout={LinearTransition} style={applyStyle(viewsWrapperStyle)}>
            <AnimatedViewWrapper
                renderView={renderPrimary}
                focused={activeView === 'primary'}
                handleViewSwitch={handleViewSwitch}
            />
            <SwitchViewsButton onPress={handleViewSwitch} label={switchLabel} />
            <AnimatedViewWrapper
                renderView={renderSecondary}
                focused={activeView === 'secondary'}
                handleViewSwitch={handleViewSwitch}
            />
        </Animated.View>
    );
};
