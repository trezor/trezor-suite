import { type ReactNode } from 'react';

import { selectIsFinpromRestricted } from '@suite/finprom';

import { useSelector } from 'src/hooks/suite';

import { TradingRestricted } from './TradingRestricted';

type TradingRouteGuardProps = {
    routeName: string | undefined;
    children: ReactNode;
};

export const TradingRouteGuard = ({ routeName, children }: TradingRouteGuardProps) => {
    const isFinpromRestricted = useSelector(selectIsFinpromRestricted);
    const isTradingRoute = !!routeName?.startsWith('wallet-trading');

    if (isFinpromRestricted && isTradingRoute) {
        return <TradingRestricted />;
    }

    return children;
};
