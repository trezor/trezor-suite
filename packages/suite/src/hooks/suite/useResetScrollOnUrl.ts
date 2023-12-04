import { useLayoutEffect, useRef } from 'react';
import { useSelector } from './useSelector';

export const useResetScrollOnUrl = () => {
    const url = useSelector(state => state.router.url);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset scroll position on url change.
    // note: if you want to remove anchor highlight on scroll. It has to be added here
    useLayoutEffect(() => {
        const { current } = scrollRef;

        if (!current) return;

        current.scrollTop = 0; // reset scroll position on url change
    }, [url]);

    return { scrollRef };
};
