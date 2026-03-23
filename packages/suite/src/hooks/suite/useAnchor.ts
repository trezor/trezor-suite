import { useContext, useEffect, useRef } from 'react';

import { selectRouterAnchor } from '@suite/router';

import { ScrollContext } from 'src/components/suite/layouts/SuiteLayout/SuiteLayout';
import { HEADER_HEIGHT_NUMERIC, SUBPAGE_NAV_HEIGHT_NUMERIC } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

const OFFSET = 30;

export const useAnchor = (anchorId: string) => {
    const scrollRef = useContext(ScrollContext);
    const anchorRef = useRef<HTMLDivElement>(null);
    const anchor = useSelector(selectRouterAnchor);

    useEffect(() => {
        if (anchorId === anchor && anchorRef.current) {
            const scrollContainer = scrollRef?.current;
            if (!scrollContainer) return;

            const headerHeight = HEADER_HEIGHT_NUMERIC + SUBPAGE_NAV_HEIGHT_NUMERIC + OFFSET;

            const element = anchorRef.current;
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;

            const offsetPosition = relativeTop - headerHeight;

            scrollContainer.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    }, [anchor, anchorId, scrollRef]);

    return {
        anchorRef,
        shouldHighlight: anchorId === anchor,
    };
};
