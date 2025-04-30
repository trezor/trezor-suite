import { useCallback, useRef, useState } from 'react';

const DEFAULT_COOLDOWN_MS = 3000;

/**
 * Hook to prevent repeated calls of an action for a specified cooldown duration.
 * Useful for buttons where you want to prevent rapid multiple clicks.
 *
 * @param cooldownMs Cooldown duration in milliseconds (default: 3000 ms)
 * @returns An object with `handleClick` function and a `disabled` flag.
 *
 * @example
 * const { handleClick, disabled } = useClickCooldown();
 *
 * <Button isDisabled={disabled} onClick={() => handleClick(() => doSomething())}>
 *     Retry
 * </Button>
 */
export const useClickCooldown = (cooldownMs: number = DEFAULT_COOLDOWN_MS) => {
    const lastClickRef = useRef<number>(0);
    const [disabled, setDisabled] = useState(false);

    const handleClick = useCallback(
        (fn: () => void) => {
            const now = Date.now();

            if (now - lastClickRef.current < cooldownMs) {
                return;
            }

            lastClickRef.current = now;
            setDisabled(true);

            fn();

            setTimeout(() => {
                setDisabled(false);
            }, cooldownMs);
        },
        [cooldownMs],
    );

    return { handleClick, disabled };
};
