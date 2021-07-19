import React, { lazy, memo, Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';

import routes from '@suite-constants/routes';
import { BundleLoader } from '@suite-components';

const components: { [key: string]: React.LazyExoticComponent<any> } = {
    'suite-index': lazy(() => import('@dashboard-views')),
    'notifications-index': lazy(() => import('@suite-views/notifications')),
    'passwords-index': lazy(() => import('@passwords-views')),
    'portfolio-index': lazy(() => import('@portfolio-views')),

    'wallet-index': lazy(() => import('@wallet-views/transactions')),
    'wallet-receive': lazy(() => import('@wallet-views/receive')),
    'wallet-details': lazy(() => import('@wallet-views/details')),
    'wallet-tokens': lazy(() => import('@wallet-views/tokens')),
    'wallet-send': lazy(() => import('@wallet-views/send')),
    'wallet-sign-verify': lazy(() => import('@wallet-views/sign-verify')),

    'wallet-coinmarket-buy': lazy(() => import('@wallet-views/coinmarket/buy')),
    'wallet-coinmarket-buy-detail': lazy(() => import('@wallet-views/coinmarket/buy/detail')),
    'wallet-coinmarket-buy-offers': lazy(() => import('@wallet-views/coinmarket/buy/offers')),
    'wallet-coinmarket-sell': lazy(() => import('@wallet-views/coinmarket/sell')),
    'wallet-coinmarket-sell-detail': lazy(() => import('@wallet-views/coinmarket/sell/detail')),
    'wallet-coinmarket-sell-offers': lazy(() => import('@wallet-views/coinmarket/sell/offers')),
    'wallet-coinmarket-exchange': lazy(() => import('@wallet-views/coinmarket/exchange')),
    'wallet-coinmarket-exchange-detail': lazy(
        () => import('@wallet-views/coinmarket/exchange/detail'),
    ),
    'wallet-coinmarket-exchange-offers': lazy(
        () => import('@wallet-views/coinmarket/exchange/offers'),
    ),
    'wallet-coinmarket-spend': lazy(() => import('@wallet-views/coinmarket/spend')),
    'wallet-coinmarket-redirect': lazy(() => import('@wallet-views/coinmarket/redirect')),

    'settings-index': lazy(() => import('@settings-views')),
    'settings-coins': lazy(() => import('@settings-views/coins')),
    'settings-debug': lazy(() => import('@settings-views/debug')),
    'settings-device': lazy(() => import('@settings-views/device')),
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
