import { useRef } from 'react';

/**
 * Returns a ref whose `current` is set to `value` synchronously during render.
 *
 * Use this when code reads `ref.current` in the same render (for example inside `useMemo` or
 * callbacks invoked during render). For values that should update only after commit, use
 * `useCurrentRef` instead.
 *
 * @param value The value to mirror into `ref.current` on every render.
 * @returns A stable ref object; `current` always matches `value` for the current render.
 */
export function useFreshRef<T>(value: T) {
    const ref = useRef<T>(value);
    ref.current = value;

    return ref;
}
