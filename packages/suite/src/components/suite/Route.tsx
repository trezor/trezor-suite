import { memo } from 'react';

import { selectRouteName } from '@suite/router';
import type { Route as RouteType } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';

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
