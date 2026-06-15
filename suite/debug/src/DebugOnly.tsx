import { type ReactNode } from 'react';

import { selectIsDebugModeActive } from '@suite/settings';
import { useSelector } from 'react-redux';

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
