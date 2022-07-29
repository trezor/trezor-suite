import { useRef, useEffect } from 'react';

export const useDidUpdate = (callback: () => void, dependencies: any[]) => {
    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current) {
            callback();
        } else {
            isMounted.current = true;
        }
    }, dependencies); // eslint-disable-line
};
