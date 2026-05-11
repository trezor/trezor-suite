import { type DependencyList, useEffect, useRef } from 'react';

export const useDidUpdate = (callback: () => void, dependencies: DependencyList) => {
    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current) {
            callback();
        } else {
            isMounted.current = true;
        }
    }, dependencies); // eslint-disable-line
};
