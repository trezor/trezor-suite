import { type RefObject, memo } from 'react';

import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';

interface AnchorHighlightHandlerProps {
    elementRef: RefObject<HTMLElement | null>;
}

// The hook subscribes to the anchor. Kept in a memoized component that renders nothing so that
// the subscription does not re-render the layout around it.
export const AnchorHighlightHandler = memo(({ elementRef }: AnchorHighlightHandlerProps) => {
    useClearAnchorHighlightOnClick(elementRef);

    return null;
});

AnchorHighlightHandler.displayName = 'AnchorHighlightHandler';
