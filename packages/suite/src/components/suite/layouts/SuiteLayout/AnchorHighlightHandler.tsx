import { type RefObject, memo } from 'react';

import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';

interface AnchorHighlightHandlerProps {
    elementRef: RefObject<HTMLElement | null>;
}

export const AnchorHighlightHandler = memo(({ elementRef }: AnchorHighlightHandlerProps) => {
    useClearAnchorHighlightOnClick(elementRef);

    return null;
});

AnchorHighlightHandler.displayName = 'AnchorHighlightHandler';
