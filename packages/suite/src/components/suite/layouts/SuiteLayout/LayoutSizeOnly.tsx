import { type ReactNode, memo } from 'react';

import { useLayoutSize } from 'src/hooks/suite';

interface LayoutSizeOnlyProps {
    children: ReactNode;
}

export const AboveTabletOnly = memo(({ children }: LayoutSizeOnlyProps) => {
    const { isBelowTablet } = useLayoutSize();

    return isBelowTablet ? null : children;
});

AboveTabletOnly.displayName = 'AboveTabletOnly';
