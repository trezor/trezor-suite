import { useLayoutEffect, useRef } from 'react';

import { selectRoute, selectRouterUrl } from '@suite/router';

import { useSelector } from './useSelector';

export const useResetScrollOnUrl = () => {
    const url = useSelector(selectRouterUrl);
    const route = useSelector(selectRoute);

    const scrollRef = useRef<HTMLDivElement>(null);
    const lastNonForegroundUrl = useRef<string | null>(null);

    // Reset scroll position on url change.
    // note: if you want to remove anchor highlight on scroll. It has to be added here
    useLayoutEffect(() => {
        const { current } = scrollRef;

        if (!current) return;

        // Don't reset scroll when a foreground app modal is active – the underlying page hasn't changed.
        if (route?.isForegroundApp) return;

        // Don't reset scroll when returning from a foreground app modal back to the same page.
        if (url === lastNonForegroundUrl.current) return;

        lastNonForegroundUrl.current = url;
        current.scrollTop = 0; // reset scroll position on url change
    }, [url, route]);

    return { scrollRef };
};
