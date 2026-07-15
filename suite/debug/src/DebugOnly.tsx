import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDebugModeActive } from './debugSelectors';

type DebugOnlyProps = {
    children: ReactNode;
    fallback?: ReactNode;
};

export const DebugOnly = ({ children, fallback = null }: DebugOnlyProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    if (!isDebugModeActive) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
