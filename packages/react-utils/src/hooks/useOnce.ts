import { useEffect, useRef } from 'react';

/**
 * Returns first only when rendered for the first time
 * and subsequent always after that
 */
export const useOnce = <T>(first: T, subsequent: T) => {
    const ref = useRef(first);
    useEffect(() => {
        ref.current = subsequent;
    }, [subsequent]);

    return ref.current;
};
