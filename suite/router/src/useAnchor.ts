import { useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectRouterAnchor } from './routerReducer';
import { ScrollContext } from './scrollContext';

export const useAnchor = (anchorId: string) => {
    const { scrollRef, topOffset } = useContext(ScrollContext);
    const anchorRef = useRef<HTMLDivElement>(null);
    const anchor = useSelector(selectRouterAnchor);

    useEffect(() => {
        if (anchorId === anchor && anchorRef.current) {
            const scrollContainer = scrollRef.current;

            if (!scrollContainer) {
                return;
            }

            const element = anchorRef.current;
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
            const offsetPosition = relativeTop - topOffset;

            scrollContainer.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    }, [anchor, anchorId, scrollRef, topOffset]);

    return {
        anchorRef,
        shouldHighlight: anchorId === anchor,
    };
};
