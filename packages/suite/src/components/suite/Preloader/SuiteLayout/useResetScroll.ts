import { useRef, useEffect } from 'react';

// useResetScroll is mandatory to reset AppWrapper scroll position on url change, fix: issue #1658
// note: if you want to remove anchor highlight on scroll. It has to be added here
export const useResetScroll = <T>(dependency: T) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const { current } = ref;

        if (!current) return;

        current.scrollTop = 0; // reset scroll position on url change
    }, [ref, dependency]);
    return ref;
};
