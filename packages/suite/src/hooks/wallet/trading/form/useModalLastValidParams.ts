import { useRef } from 'react';

/**
 * Returns the last non-null `params` value while `isOpen` is true.
 * Prevents modal flicker when params temporarily become null (e.g. during a quote refetch).
 * Clears the cached value once the modal closes so the next open starts fresh.
 */
export const useModalLastValidParams = <T>(params: T | null, isOpen: boolean): T | null => {
    const ref = useRef<T | null>(params);

    if (!isOpen) {
        ref.current = null;
    } else if (params) {
        ref.current = params;
    }

    return ref.current;
};
