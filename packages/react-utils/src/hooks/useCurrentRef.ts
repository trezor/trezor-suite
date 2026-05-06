import { useEffect, useRef } from 'react';

/**
 * Returns a ref whose `current` is set to `value` in an effect after commit, not during render.
 *
 * Unlike `useFreshRef`, reads of `ref.current` during the render pass still see the previous
 * value until effects run. Prefer `useFreshRef` when callers need the latest value synchronously
 * during render (for example inside `useMemo`).
 *
 * @param value The value to assign to `ref.current` when it changes.
 * @returns A stable ref object; `current` tracks `value` after commit.
 */
export function useCurrentRef<T>(value: T) {
    const ref = useRef<T>(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}
