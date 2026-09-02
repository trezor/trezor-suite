import { type ReactNode, type RefObject, memo, useMemo } from 'react';

import { ScrollContext } from '@suite/router';

import { HEADER_HEIGHT_NUMERIC, SUBPAGE_NAV_HEIGHT_NUMERIC } from 'src/constants/suite/layout';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';

const ANCHOR_SCROLL_OFFSET = 30;
const TOP_OFFSET = HEADER_HEIGHT_NUMERIC + SUBPAGE_NAV_HEIGHT_NUMERIC + ANCHOR_SCROLL_OFFSET;

interface ScrollProviderProps {
    scrollRef: RefObject<HTMLDivElement | null>;
    children: ReactNode;
}

export const ScrollProvider = memo(({ scrollRef, children }: ScrollProviderProps) => {
    useResetScrollOnUrl(scrollRef);

    const value = useMemo(() => ({ scrollRef, topOffset: TOP_OFFSET }), [scrollRef]);

    return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
});

ScrollProvider.displayName = 'ScrollProvider';
