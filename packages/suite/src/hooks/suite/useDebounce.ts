import { useCallback, useRef } from 'react';
import { createDeferred, Deferred } from '@suite-utils/deferred';

// composeTransaction should be debounced from both sides
// first: `timeout` prevents from calling 'trezor-connect' method to many times (inputs mad-clicking)
// second: `dfd` prevents from processing outdated results from 'trezor-connect' (timeout was resolved correctly but 'trezor-connect' method waits too long to respond while another "compose" was called)

export const useDebounce = () => {
    const timeout = useRef<ReturnType<typeof setTimeout>>(-1);
    const dfd = useRef<Deferred<boolean> | null>(null);

    const debounce = useCallback(
        async <F extends (...args: any) => Promise<any>>(
            fn: F,
            useTimeout = true,
        ): Promise<ReturnType<F>> => {
            // clear previous timeout
            if (timeout.current >= 0) clearTimeout(timeout.current);
            // set new timeout
            if (useTimeout) {
                const timeoutDfd = createDeferred();
                const newTimeout = setTimeout(timeoutDfd.resolve, 300);
                timeout.current = newTimeout;
                await timeoutDfd.promise;
            }
            timeout.current = -1; // reset timeout

            // reject previous pending call, do not process results from trezor-connect
            if (dfd.current) dfd.current.resolve(false);

            // set new pending call
            const pending = createDeferred<boolean>();
            dfd.current = pending;

            // call compose function
            const result = await fn();
            pending.resolve(true); // try to unlock, it could be already resolved tho (see: dfd.resolve above)
            const shouldBeProcessed = await pending.promise; // catch potential rejection
            dfd.current = null; // reset dfd
            if (!shouldBeProcessed) throw new Error('ignored');
            return result;
        },
        [timeout, dfd],
    );

    return {
        debounce,
    };
};
