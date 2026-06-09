import { useEffect, useRef, useState } from 'react';

const defaultGetKey = (value: unknown): string => {
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
};

/**
 * Returns `value` debounced by `debounceMs`. The first value is applied
 * immediately; subsequent changes are committed only after `debounceMs` of
 * quiet. Change detection is keyed on `getKey(value)` (content, not reference),
 * so an inline object recreated each render with identical contents does not
 * restart the timer. `0`/`undefined` disables debouncing.
 */
export const useDebouncedValue = <A>(
    value: A,
    debounceMs?: number,
    getKey: (value: A) => string = defaultGetKey,
): A => {
    const [committed, setCommitted] = useState(value);
    const valueRef = useRef(value);
    valueRef.current = value;

    const key = getKey(value);

    useEffect(() => {
        if (!debounceMs) return undefined;

        const id = setTimeout(() => setCommitted(valueRef.current), debounceMs);

        return () => clearTimeout(id);
    }, [key, debounceMs]);

    return debounceMs ? committed : value;
};
