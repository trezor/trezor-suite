import { type ReactNode } from 'react';

import { selectIsRegionRestricted } from '@suite/regions';

import { TradingRestricted } from './TradingRestricted';
import { useSelector } from '../../../../hooks/suite';

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
