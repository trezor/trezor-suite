import { type ReactNode, memo } from 'react';

import { useLayoutSize } from 'src/hooks/suite';

interface LayoutSizeOnlyProps {
    children: ReactNode;
}

// The breakpoints are read here rather than in the layout, so that crossing one re-renders only
// these two components instead of everything the layout renders.
export const BelowTabletOnly = memo(({ children }: LayoutSizeOnlyProps) => {
    const { isBelowTablet } = useLayoutSize();

    return isBelowTablet ? children : null;
});

BelowTabletOnly.displayName = 'BelowTabletOnly';

export const AboveTabletOnly = memo(({ children }: LayoutSizeOnlyProps) => {
    const { isBelowTablet } = useLayoutSize();

    return isBelowTablet ? null : children;
});

AboveTabletOnly.displayName = 'AboveTabletOnly';
