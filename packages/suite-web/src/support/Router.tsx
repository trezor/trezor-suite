import { lazy, memo, Suspense, LazyExoticComponent, ComponentType } from 'react';
import { Switch, Route } from 'react-router-dom';

import routes from 'src/constants/suite/routes';
import { BundleLoader } from 'src/components/suite';
import { PageName } from '@suite-common/suite-types';

const components: Record<PageName, LazyExoticComponent<ComponentType<any>>> = {
    'suite-index': lazy(() =>
        import(/* webpackChunkName: "dashboard" */ 'src/views/dashboard/index').then(
            ({ Dashboard }) => ({ default: Dashboard }),
        ),
    ),
    'notifications-index': lazy(
        () => import(/* webpackChunkName: "notifications" */ 'src/views/suite/notifications'),
    ),

    // wallet
    'wallet-index': lazy(() =>
        import(/* webpackChunkName: "wallet" */ 'src/views/wallet/transactions/Transactions').then(
            ({ Transactions }) => ({ default: Transactions }),
        ),
    ),
    'wallet-receive': lazy(() =>
        import(/* webpackChunkName: "wallet" */ 'src/views/wallet/receive/Receive').then(
            ({ Receive }) => ({ default: Receive }),
        ),
    ),
    'wallet-details': lazy(
        () => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/details'),
    ),
    'wallet-tokens-coins': lazy(
        () => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/tokens/coins'),
    ),
    'wallet-tokens-hidden': lazy(
        () => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/tokens/hidden-tokens'),
    ),
    'wallet-send': lazy(() => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/send')),
    'wallet-staking': lazy(() =>
        import(/* webpackChunkName: "wallet" */ 'src/views/wallet/staking/WalletStaking').then(
            ({ WalletStaking }) => ({ default: WalletStaking }),
        ),
    ),
    'wallet-sign-verify': lazy(
        () => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/sign-verify'),
    ),
    'wallet-anonymize': lazy(
        () => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/anonymize'),
    ),

    // coinmarket
    'wallet-coinmarket-buy': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/buy'),
    ),
    'wallet-coinmarket-buy-detail': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/buy/detail'),
    ),
    'wallet-coinmarket-buy-offers': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/buy/offers'),
    ),
    'wallet-coinmarket-buy-confirm': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/buy/CoinmarketBuyConfirm'
        ).then(({ CoinmarketBuyConfirm }) => ({ default: CoinmarketBuyConfirm })),
    ),
    'wallet-coinmarket-sell': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/sell_new/CoinmarketSellForm'
        ).then(({ CoinmarketSellForm }) => ({ default: CoinmarketSellForm })),
    ),
    'wallet-coinmarket-sell-detail': lazy(
        () =>
            import(
                /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/sell_new/detail'
            ),
    ),
    'wallet-coinmarket-sell-offers': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/sell_new/CoinmarketSellOffers'
        ).then(({ CoinmarketSellOffers }) => ({ default: CoinmarketSellOffers })),
    ),
    'wallet-coinmarket-sell-confirm': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/sell_new/CoinmarketSellConfirm'
        ).then(({ CoinmarketSellConfirm }) => ({ default: CoinmarketSellConfirm })),
    ),
    'wallet-coinmarket-exchange': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeForm'
        ).then(({ CoinmarketExchangeForm }) => ({ default: CoinmarketExchangeForm })),
    ),
    'wallet-coinmarket-exchange-detail': lazy(
        () =>
            import(
                /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/exchange_new/detail'
            ),
    ),
    'wallet-coinmarket-exchange-offers': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeOffers'
        ).then(({ CoinmarketExchangeOffers }) => ({ default: CoinmarketExchangeOffers })),
    ),
    'wallet-coinmarket-exchange-confirm': lazy(() =>
        import(
            /* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeConfirm'
        ).then(({ CoinmarketExchangeConfirm }) => ({ default: CoinmarketExchangeConfirm })),
    ),
    'wallet-coinmarket-dca': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/DCA'),
    ),
    'wallet-coinmarket-redirect': lazy(
        () => import(/* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/redirect'),
    ),
    'wallet-coinmarket-transactions': lazy(
        () =>
            import(/* webpackChunkName: "coinmarket" */ 'src/views/wallet/coinmarket/transactions'),
    ),

    // password-manager
    'password-manager-index': lazy(
        () => import(/* webpackChunkName: "password-manager" */ 'src/views/password-manager'),
    ),

    // settings
    'settings-index': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsGeneral/SettingsGeneral'
        ).then(({ SettingsGeneral }) => ({ default: SettingsGeneral })),
    ),
    'settings-coins': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsCoins/SettingsCoins'
        ).then(({ SettingsCoins }) => ({ default: SettingsCoins })),
    ),
    'settings-debug': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsDebug/SettingsDebug'
        ).then(({ SettingsDebug }) => ({ default: SettingsDebug })),
    ),
    'settings-device': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsDevice/SettingsDevice'
        ).then(({ SettingsDevice }) => ({ default: SettingsDevice })),
    ),
};

const AppRouter = () => (
    <Suspense fallback={<BundleLoader />}>
        <Switch>
            {routes.map(route => (
                <Route
                    key={route.name}
                    path={process.env.ASSET_PREFIX + route.pattern}
                    exact={route.exact}
                    component={components[route.name as PageName]}
                />
            ))}
        </Switch>
    </Suspense>
);

export default memo(AppRouter);
