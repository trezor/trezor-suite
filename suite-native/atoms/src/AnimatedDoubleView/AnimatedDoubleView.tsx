import { useCallback, useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { noop } from '@trezor/utils';

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
    activeView?: ActiveView;
};

export const ANIMATED_DOUBLE_VIEW_SWITCH_ANIMATION_DURATION = ANIMATION_DURATION;
export const ANIMATED_DOUBLE_VIEW_WRAPPER_HEIGHT = 108;

const viewsWrapperStyle = prepareNativeStyle(() => ({
    height: ANIMATED_DOUBLE_VIEW_WRAPPER_HEIGHT,
    justifyContent: 'space-between',
}));

export const AnimatedDoubleView = ({
    renderPrimary,
    renderSecondary,
    onViewSwitch = noop,
    switchLabel,
    activeView: controlledActiveView,
}: AnimatedDoubleViewProps) => {
    const { applyStyle } = useNativeStyles();

    const [internalActiveView, setInternalActiveView] = useState<ActiveView>('primary');
    const activeView = controlledActiveView ?? internalActiveView;

    const handleViewSwitch = useCallback(() => {
        const nextActiveView = activeView === 'primary' ? 'secondary' : 'primary';

        if (controlledActiveView === undefined) {
            setInternalActiveView(nextActiveView);
        }

        onViewSwitch(nextActiveView);
    }, [activeView, controlledActiveView, onViewSwitch]);

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
