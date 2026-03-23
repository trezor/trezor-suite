import { type ReactNode, type RefObject, useCallback, useRef, useState } from 'react';

import { useUpdateEffect } from '@suite-native/helpers';

import {
    ANIMATED_DOUBLE_VIEW_SWITCH_ANIMATION_DURATION,
    type ActiveView,
    AnimatedDoubleView,
    type RenderViewProps,
} from './AnimatedDoubleView';
import { type InputType } from '../Input/Input';

export type RenderInputProps = RenderViewProps & {
    inputRef: RefObject<InputType | null>;
};

export type AnimatedDoubleInputProps = {
    renderPrimary: (props: RenderInputProps) => ReactNode;
    renderSecondary: (props: RenderInputProps) => ReactNode;
    onInputSwitch?: (activeView: ActiveView) => void;
    switchLabel?: string;
};

const noop = () => {};

export const AnimatedDoubleInput = ({
    renderPrimary,
    renderSecondary,
    onInputSwitch = noop,
    switchLabel,
}: AnimatedDoubleInputProps) => {
    const primaryInputRef = useRef<InputType | null>(null);
    const secondaryInputRef = useRef<InputType | null>(null);
    const [activeInputRef, setActiveInputRef] =
        useState<RefObject<InputType | null>>(primaryInputRef);

    // focus input after the view switch animation is done
    // do not focus input on initial render
    useUpdateEffect(
        useCallback(() => {
            const timeoutID = setTimeout(() => {
                if (activeInputRef.current) {
                    activeInputRef.current.focus();
                }
            }, ANIMATED_DOUBLE_VIEW_SWITCH_ANIMATION_DURATION);

            return () => {
                clearTimeout(timeoutID);
            };
        }, [activeInputRef]),
    );

    const focusInput = useCallback(
        (activeView: ActiveView) => {
            setActiveInputRef(activeView === 'primary' ? primaryInputRef : secondaryInputRef);
            onInputSwitch(activeView);
        },
        [onInputSwitch],
    );

    return (
        <AnimatedDoubleView
            renderPrimary={props =>
                renderPrimary({
                    ...props,
                    inputRef: primaryInputRef,
                })
            }
            renderSecondary={props =>
                renderSecondary({
                    ...props,
                    inputRef: secondaryInputRef,
                })
            }
            onViewSwitch={focusInput}
            switchLabel={switchLabel}
        />
    );
};
