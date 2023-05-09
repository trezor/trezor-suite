import React, { lazy, memo, Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';

import routes from '@suite-constants/routes';
import { BundleLoader } from '@suite-components';

const components: { [key: string]: React.LazyExoticComponent<any> } = {
    'suite-index': lazy(() => import(/* webpackChunkName: "dashboard" */ '@suite/views/dashboard')),
    'notifications-index': lazy(
        () => import(/* webpackChunkName: "notifications" */ '@suite-views/notifications'),
    ),

    // wallet
    'wallet-index': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@wallet-views/transactions/Transactions').then(
            ({ Transactions }) => ({ default: Transactions }),
        ),
    ),
    'wallet-receive': lazy(() => import(/* webpackChunkName: "wallet" */ '@wallet-views/receive')),
    'wallet-details': lazy(() => import(/* webpackChunkName: "wallet" */ '@wallet-views/details')),
    'wallet-tokens': lazy(() => import(/* webpackChunkName: "wallet" */ '@wallet-views/tokens')),
    'wallet-send': lazy(() => import(/* webpackChunkName: "wallet" */ '@wallet-views/send')),
    'wallet-staking': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@wallet-views/staking/WalletStaking').then(
            ({ WalletStaking }) => ({ default: WalletStaking }),
        ),
    ),
    'wallet-sign-verify': lazy(
        () => import(/* webpackChunkName: "wallet" */ '@wallet-views/sign-verify'),
    ),
    'wallet-anonymize': lazy(
        () => import(/* webpackChunkName: "wallet" */ '@wallet-views/anonymize'),
    ),

    // coinmarket
    'wallet-coinmarket-buy': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/buy'),
    ),
    'wallet-coinmarket-buy-detail': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/buy/detail'),
    ),
    'wallet-coinmarket-buy-offers': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/buy/offers'),
    ),
    'wallet-coinmarket-sell': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/sell'),
    ),
    'wallet-coinmarket-sell-detail': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/sell/detail'),
    ),
    'wallet-coinmarket-sell-offers': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/sell/offers'),
    ),
    'wallet-coinmarket-exchange': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/exchange'),
    ),
    'wallet-coinmarket-exchange-detail': lazy(
        () =>
            import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/exchange/detail'),
    ),
    'wallet-coinmarket-exchange-offers': lazy(
        () =>
            import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/exchange/offers'),
    ),
    'wallet-coinmarket-spend': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/spend'),
    ),
    'wallet-coinmarket-p2p': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/p2p/form'),
    ),
    'wallet-coinmarket-p2p-offers': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/p2p/offers'),
    ),
    'wallet-coinmarket-savings-setup': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/savings/setup'),
    ),
    'wallet-coinmarket-savings-setup-continue': lazy(
        () =>
            import(
                /* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/savings/setup/continue'
            ),
    ),
    'wallet-coinmarket-savings-setup-waiting': lazy(
        () =>
            import(
                /* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/savings/setup/waiting'
            ),
    ),
    'wallet-coinmarket-savings-payment-info': lazy(
        () =>
            import(
                /* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/savings/payment-info'
            ),
    ),
    'wallet-coinmarket-savings-overview': lazy(
        () =>
            import(
                /* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/savings/overview'
            ),
    ),
    'wallet-coinmarket-redirect': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ '@wallet-views/coinmarket/redirect'),
    ),

    // settings
    'settings-index': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@settings-views/general/SettingsGeneral').then(
            ({ SettingsGeneral }) => ({ default: SettingsGeneral }),
        ),
    ),
    'settings-coins': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@settings-views/coins/SettingsCoins').then(
            ({ SettingsCoins }) => ({ default: SettingsCoins }),
        ),
    ),
    'settings-debug': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@settings-views/debug/SettingsDebug').then(
            ({ SettingsDebug }) => ({ default: SettingsDebug }),
        ),
    ),
    'settings-device': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@settings-views/device/SettingsDevice').then(
            ({ SettingsDevice }) => ({ default: SettingsDevice }),
        ),
    ),
};

const AppRouter = () => (
    // inititating strict mode higher would throw an error from react-helmet
    // TODO: replace react-helmet with a maintained alternative
    // strict mode is commented out because of its interplay with compose errors in send form
    // <React.StrictMode>
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
    // </React.StrictMode>
);

export default memo(AppRouter);
