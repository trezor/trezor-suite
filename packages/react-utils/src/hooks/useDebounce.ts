import { useCallback, useEffect, useRef } from 'react';

import type { TimerId } from '@trezor/type-utils';
import { createDeferred } from '@trezor/utils';

// composeTransaction should be debounced from both sides
// `timeout` prevents from calling '@trezor/connect' method to many times (inputs mad-clicking)
// TODO: maybe it should be converted to regular module, could be useful elsewhere
export const useDebounce = () => {
    const timeout = useRef<TimerId | null>(null);

    const debounce = useCallback(
        async <T>(fn: () => T | Promise<T>): Promise<T> => {
            // clear previous timeout
            if (timeout.current) clearTimeout(timeout.current);
            // set new timeout
            const timeoutDfd = createDeferred();
            const newTimeout = setTimeout(timeoutDfd.resolve, 300);
            timeout.current = newTimeout;
            await timeoutDfd.promise;

            timeout.current = null; // reset timeout
            // call compose function
            const result = await fn();

            return result;
        },
        [timeout],
    );

    useEffect(
        () => () => {
            if (timeout.current) clearTimeout(timeout.current);
        },
        [],
    );

    return debounce;
};
