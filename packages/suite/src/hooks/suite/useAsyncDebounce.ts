import { useCallback, useRef } from 'react';
import { createDeferred } from '@trezor/utils';

type TimeoutType = ReturnType<typeof setTimeout>; // resolves to Timeout type in react-native, number otherwise

// composeTransaction should be debounced from both sides
// `timeout` prevents from calling 'trezor-connect' method to many times (inputs mad-clicking)
// TODO: maybe it should be converted to regular module, could be useful elsewhere
export const useAsyncDebounce = () => {
    const timeout = useRef<TimeoutType | null>(null);

    const debounce = useCallback(
        async <F extends (...args: any) => Promise<any>>(fn: F): Promise<ReturnType<F>> => {
            // clear previous timeout
            if (timeout.current) clearTimeout(timeout.current);
            // set new timeout
            const timeoutDfd = createDeferred();
            // @ts-ignore needed with @types/react-native 0.63.45, could be a bug
            const newTimeout = setTimeout(timeoutDfd.resolve, 300);
            // @ts-ignore needed with @types/react-native 0.63.45, could be a bug
            timeout.current = newTimeout;
            await timeoutDfd.promise;

            timeout.current = null; // reset timeout
            // call compose function
            const result = await fn();
            return result;
        },
        [timeout],
    );

    return debounce;
};
