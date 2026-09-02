import { useEffect, useMemo, useState } from 'react';

import { useFreshRef } from './useFreshRef';

/** Shallow comparison identical to React's internal `areHookInputsEqual`. */
const depsEqual = (prev: readonly unknown[], next: readonly unknown[]) =>
    prev.length === next.length && prev.every((dep, i) => Object.is(dep, next[i]));

/**
 * Memoizes `getValue` by `deps`. A synchronously returned value is available already during
 * the first render, exactly like with `useMemo`. A returned promise is awaited instead and its
 * result is returned only while `deps` match the deps it was resolved for, otherwise
 * `undefined`. A reused component instance (e.g. recycled list cell) therefore never renders
 * a stale resolution, even when promises settle out of order. A rejected promise is swallowed
 * and the hook keeps returning `undefined` for those deps.
 */
export function useAsyncMemo<T>(
    getValue: () => T | Promise<T>,
    deps: readonly unknown[],
): T | undefined {
    const [resolved, setResolved] = useState<{ deps: readonly unknown[]; value: T }>();
    const getValueRef = useFreshRef(getValue);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const value = useMemo(() => getValueRef.current(), deps);

    useEffect(() => {
        if (!(value instanceof Promise)) {
            return;
        }

        let cancelled = false;

        value.then(
            resolvedValue => {
                if (!cancelled) {
                    setResolved({ deps, value: resolvedValue });
                }
            },
            () => {}, // Reject → stay undefined, callers render their fallback.
        );

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    if (!(value instanceof Promise)) {
        return value;
    }

    return resolved && depsEqual(resolved.deps, deps) ? resolved.value : undefined;
}
