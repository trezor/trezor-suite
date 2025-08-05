import { useEffect, useRef } from 'react';

export const usePreviousDefined = <T>(value: T | undefined): T | undefined => {
    const ref = useRef<T>(value);

    useEffect(() => {
        if (value !== undefined) {
            ref.current = value;
        }
    }, [value]);

    return ref.current;
};
