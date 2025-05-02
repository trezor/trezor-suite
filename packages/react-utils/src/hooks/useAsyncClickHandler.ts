import { useCallback, useState } from 'react';

/**
 * Hook to handle async click actions and prevent repeated triggering while the action is running.
 * Useful for preventing double submits or accidental multiple async calls on buttons.
 *
 * @returns An object with `handleClick` function and a `disabled` flag.
 *
 * @example
 * const { handleClick, disabled } = useAsyncClickHandler();
 *
 * <Button isDisabled={disabled} onClick={() => handleClick(myAsyncFn)}>
 *     Send
 * </Button>
 */
export const useAsyncClickHandler = <T>() => {
    const [disabled, setDisabled] = useState(false);

    const handleClick = useCallback(
        async (fn: () => Promise<T>) => {
            if (disabled) return;

            setDisabled(true);
            try {
                await fn();
            } finally {
                setDisabled(false);
            }
        },
        [disabled],
    );

    return { handleClick, disabled };
};
