import { useCallback, useEffect, useRef } from 'react';

import type { TimerId } from '@trezor/type-utils';
import { createDeferred } from '@trezor/utils';

type AsyncFunction = (...args: any) => Promise<any>;
type SyncFunction = (...args: any) => any;

export const DEFAULT_DEBOUNCE_DELAY = 300;

export type DebounceOptions = {
    delay?: number;
};

// composeTransaction should be debounced from both sides
// `timeout` prevents from calling '@trezor/connect' method to many times (inputs mad-clicking)
// TODO: maybe it should be converted to regular module, could be useful elsewhere
export const useDebounce = (options?: DebounceOptions) => {
    const timeout = useRef<TimerId | null>(null);
    const delay = options?.delay ?? DEFAULT_DEBOUNCE_DELAY;

    const debounce = useCallback(
        async <F extends AsyncFunction | SyncFunction>(fn: F): Promise<ReturnType<F>> => {
            // clear previous timeout
            if (timeout.current) clearTimeout(timeout.current);
            // set new timeout
            const timeoutDfd = createDeferred();
            const newTimeout = setTimeout(timeoutDfd.resolve, delay);
            timeout.current = newTimeout;
            await timeoutDfd.promise;

            timeout.current = null; // reset timeout
            // call compose function
            const result = await fn();

            return result;
        },
        [timeout, delay],
    );

    useEffect(
        () => () => {
            if (timeout.current) clearTimeout(timeout.current);
        },
        [],
    );

    return debounce;
};
