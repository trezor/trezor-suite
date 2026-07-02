import { useEffect, useState } from 'react';

import { useFreshRef } from './useFreshRef';

/**
 * Resolves `getValue` asynchronously and returns the result only while `key` matches the key
 * it was resolved for, otherwise `undefined`. A reused component instance (e.g. recycled list
 * cell) therefore never renders a stale resolution, even when promises settle out of order.
 * A rejected `getValue` is swallowed and the hook keeps returning `undefined` for that key.
 */
export function useKeyedAsyncValue<T>(key: string, getValue: () => Promise<T>): T | undefined {
    const [resolved, setResolved] = useState<{ key: string; value: T }>();
    const getValueRef = useFreshRef(getValue);

    useEffect(() => {
        let cancelled = false;

        getValueRef.current().then(
            value => {
                if (!cancelled) {
                    setResolved({ key, value });
                }
            },
            () => {}, // reject → stay undefined, callers render their fallback
        );

        return () => {
            cancelled = true;
        };
    }, [key, getValueRef]);

    return resolved?.key === key ? resolved.value : undefined;
}
