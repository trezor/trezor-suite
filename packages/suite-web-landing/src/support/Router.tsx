import React, { lazy, memo, Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';

import { BundleLoader } from '@suite-components';

const routes = [
    {
        name: 'landing-index',
        pattern: '/',
        exact: true,
    },
    {
        name: 'landing-start',
        pattern: '/start',
        exact: true,
    },
];

const components: { [key: string]: React.LazyExoticComponent<any> } = {
    'landing-index': lazy(() => import('../../components/Index')),
    'landing-start': lazy(() => import('../../components/Start')),
};

const AppRouter = () => (
    <Suspense fallback={<BundleLoader />}>
        <Switch>
            {routes.map(route => (
                <Route
                    key={route.name}
                    path={process.env.ASSET_PREFIX + route.pattern}
                    exact={route.exact}
                    component={components[route.name]}
                />
            ))}
        </Switch>
    </Suspense>
);

export default memo(AppRouter);
