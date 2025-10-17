import { memo } from 'react';

import type { Route as RouteType } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

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
