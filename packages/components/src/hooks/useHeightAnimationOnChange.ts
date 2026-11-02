import { useEffect, useLayoutEffect, useRef } from 'react';

import { motionEasingStrings } from '../config/motion';

const HEIGHT_ANIMATION_OPTIONS: KeyframeAnimationOptions = {
    duration: 200,
    easing: motionEasingStrings.transition,
};

type UseHeightAnimationOnChangeParams = {
    trigger: unknown;
    isDisabled?: boolean;
};

/**
 * Animates the element from its last laid-out height to its new `auto` height whenever `trigger`
 * changes. Any other size change, such as a validation message appearing, stays instant.
 */
export const useHeightAnimationOnChange = ({
    trigger,
    isDisabled,
}: UseHeightAnimationOnChangeParams) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const laidOutHeightRef = useRef<number | null>(null);
    const previousTriggerRef = useRef(trigger);

    useEffect(() => {
        const element = elementRef.current;

        if (!element) return;

        // The callback runs after layout and only writes a ref, so tracking the height costs
        // neither a forced layout nor a re-render.
        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                laidOutHeightRef.current = entry.contentRect.height;
            }
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    // Runs before the browser paints the changed DOM, while laidOutHeightRef still holds the old
    // height. useEffect or requestAnimationFrame can run after the new height is already painted.
    useLayoutEffect(() => {
        const element = elementRef.current;
        const laidOutHeight = laidOutHeightRef.current;
        const hasTriggerChanged = trigger !== previousTriggerRef.current;

        previousTriggerRef.current = trigger;

        if (!hasTriggerChanged || isDisabled || !element || laidOutHeight === null) return;

        // calc-size() lets the animation end at the new auto height without measuring it. Browsers
        // that lack it (Firefox, Safari) resize instantly.
        if (!CSS.supports('height', 'calc-size(auto, size)')) return;

        element.animate(
            [{ height: `${laidOutHeight}px` }, { height: 'calc-size(auto, size)' }],
            HEIGHT_ANIMATION_OPTIONS,
        );
    }, [trigger, isDisabled]);

    return elementRef;
};
