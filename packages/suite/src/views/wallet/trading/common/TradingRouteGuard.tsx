import { type ReactNode } from 'react';

import { selectIsRegionRestricted } from '@suite/regions';

import { useSelector } from '#src/hooks/suite';

import { TradingRestricted } from './TradingRestricted';

type TradingRouteGuardProps = {
    routeName: string | undefined;
    children: ReactNode;
};

export const TradingRouteGuard = ({ routeName, children }: TradingRouteGuardProps) => {
    const isRegionRestricted = useSelector(selectIsRegionRestricted);
    const isTradingRoute = !!routeName?.startsWith('wallet-trading');

    if (isRegionRestricted && isTradingRoute) {
        return <TradingRestricted />;
    }

    return children;
};
