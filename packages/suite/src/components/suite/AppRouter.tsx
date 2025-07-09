import { ComponentType, createElement, memo } from 'react';
import { Route, Routes } from 'react-router';

import { PageName } from '@suite-common/suite-types';

import routes from 'src/constants/suite/routes';

type AppRouterProps = {
    components: Record<PageName, ComponentType>;
};

export const AppRouter = memo(({ components }: AppRouterProps) => (
    <Routes>
        {routes
            .filter(route => Object.keys(components).includes(route.name))
            .map(route => (
                <Route
                    key={route.name}
                    path={`${process.env.ASSET_PREFIX}${route.pattern}${route.hasNestedRoutes ? '/*' : ''}`}
                    element={createElement(components[route.name as PageName])}
                />
            ))}
    </Routes>
));
