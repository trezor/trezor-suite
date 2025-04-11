import { useEffect, useRef } from 'react';

import { SCROLL_WRAPPER_ID } from 'src/components/suite/layouts/SuiteLayout/SuiteLayout';
import { HEADER_HEIGHT_NUMERIC, SUBPAGE_NAV_HEIGHT_NUMERIC } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

const OFFSET = 30;

export const useAnchor = (anchorId: string | undefined) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const anchor = useSelector(state => state.router.anchor);

    useEffect(() => {
        if (anchorId === anchor && anchorRef.current) {
            const scrollContainer = document.getElementById(SCROLL_WRAPPER_ID);
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
    }, [anchor, anchorId]);

    return {
        anchorRef,
        shouldHighlight: anchorId === anchor,
    };
};
