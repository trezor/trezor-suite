import { memo } from 'react';

import { type Route as RouteType, selectRouteName } from '@suite/router';
import { useSelector } from '@suite-common/redux-utils';
const RouteComponent = ({
    children,
    fallback,
    name,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    name: RouteType['name'];
}) => {
    const routeName = useSelector(selectRouteName);

    if (routeName !== name) {
        return fallback ?? null;
    }

    return children ?? null;
};

export const Route = memo(RouteComponent) as typeof RouteComponent;
