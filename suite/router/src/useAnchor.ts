import { useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectRouterAnchor } from './routerReducer';
import { ScrollContext } from './scrollContext';

export const useAnchor = <TElement extends HTMLElement = HTMLDivElement>(anchorId: string) => {
    const { scrollRef, topOffset } = useContext(ScrollContext);
    const anchorRef = useRef<TElement>(null);
    const anchor = useSelector(selectRouterAnchor);
    const isAnchored = anchorId === anchor;

    useEffect(() => {
        const element = anchorRef.current;
        const scrollContainer = scrollRef.current;

        if (!isAnchored || !element || !scrollContainer) {
            return;
        }

        // An IntersectionObserver hands over geometry the browser has already computed,
        // unlike getBoundingClientRect which forces a synchronous layout. It reports once
        // right after observation starts, which is all the anchor needs — and that first
        // report also covers elements that mount after the anchor was set.
        const observer = new IntersectionObserver(
            entries => {
                const lastEntry = entries.at(-1);

                observer.disconnect();

                if (!lastEntry?.rootBounds) {
                    return;
                }

                const relativeTop =
                    lastEntry.boundingClientRect.top -
                    lastEntry.rootBounds.top +
                    scrollContainer.scrollTop;

                window.requestAnimationFrame(() => {
                    scrollContainer.scrollTo({
                        top: relativeTop - topOffset,
                        behavior: 'smooth',
                    });
                });
            },
            { root: scrollContainer },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [isAnchored, scrollRef, topOffset]);

    return {
        anchorRef,
        shouldHighlight: isAnchored,
    };
};
