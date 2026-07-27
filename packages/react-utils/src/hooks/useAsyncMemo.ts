import { useEffect, useState } from 'react';

import { useFreshRef } from './useFreshRef';

/** Shallow comparison identical to React's internal `areHookInputsEqual`. */
const depsEqual = (prev: readonly unknown[], next: readonly unknown[]) =>
    prev.length === next.length && prev.every((dep, i) => Object.is(dep, next[i]));

/**
 * Resolves `getValue` asynchronously and returns the result only while `deps` match the deps
 * it was resolved for, otherwise `undefined`. A reused component instance (e.g. recycled list
 * cell) therefore never renders a stale resolution, even when promises settle out of order.
 * A rejected `getValue` is swallowed and the hook keeps returning `undefined` for those deps.
 */
export function useAsyncMemo<T>(
    getValue: () => Promise<T>,
    deps: readonly unknown[],
): T | undefined {
    const [resolved, setResolved] = useState<{ deps: readonly unknown[]; value: T }>();
    const getValueRef = useFreshRef(getValue);

    useEffect(() => {
        let cancelled = false;

        getValueRef.current().then(
            value => {
                if (!cancelled) {
                    setResolved({ deps, value });
                }
            },
            () => {}, // reject → stay undefined, callers render their fallback
        );

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return resolved && depsEqual(resolved.deps, deps) ? resolved.value : undefined;
}
