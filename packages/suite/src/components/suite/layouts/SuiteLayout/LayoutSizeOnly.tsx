import { type ReactNode, memo } from 'react';

import { useLayoutSize } from 'src/hooks/suite';

interface LayoutSizeOnlyProps {
    children: ReactNode;
}

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
