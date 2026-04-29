import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

import { type PageName } from '@suite/router';

export const webComponents: Record<PageName, LazyExoticComponent<ComponentType>> = {
    'suite-index': lazy(() =>
        import(/* webpackChunkName: "dashboard" */ 'src/views/dashboard/index').then(
            ({ Dashboard }) => ({ default: Dashboard }),
        ),
    ),
    'suite-earn': lazy(() =>
        import(/* webpackChunkName: "earn" */ 'src/views/earn/index').then(({ Earn }) => ({
            default: Earn,
        })),
    ),
    'earn-supply': lazy(() =>
        import(/* webpackChunkName: "earn" */ 'src/views/earn/supply/index').then(
            ({ EarnSupply }) => ({
                default: EarnSupply,
            }),
        ),
    ),
    'earn-withdraw': lazy(() =>
        import(/* webpackChunkName: "earn" */ 'src/views/earn/withdraw/index').then(
            ({ EarnWithdraw }) => ({
                default: EarnWithdraw,
            }),
        ),
    ),
    'earn-claim': lazy(() =>
        import(/* webpackChunkName: "earn" */ 'src/views/earn/claim/index').then(
            ({ EarnClaim }) => ({
                default: EarnClaim,
            }),
        ),
    ),
    'suite-connect-popup': lazy(() =>
        import(/* webpackChunkName: "connect-popup" */ 'src/views/connect-popup/index').then(
            ({ ConnectPopup }) => ({ default: ConnectPopup }),
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
    'wallet-tokens': lazy(() => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/tokens')),
    'wallet-nfts': lazy(() => import(/* webpackChunkName: "wallet" */ 'src/views/wallet/nfts')),
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

    // trading
    'wallet-trading-buy': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/buy/TradingBuyForm'
        ).then(({ TradingBuyForm }) => ({ default: TradingBuyForm })),
    ),
    'wallet-trading-buy-detail': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/buy/TradingBuyDetail'
        ).then(({ TradingBuyDetail }) => ({ default: TradingBuyDetail })),
    ),
    'wallet-trading-buy-offers': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/buy/TradingBuyOffers'
        ).then(({ TradingBuyOffers }) => ({ default: TradingBuyOffers })),
    ),
    'wallet-trading-buy-confirm': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/buy/TradingBuyConfirm'
        ).then(({ TradingBuyConfirm }) => ({ default: TradingBuyConfirm })),
    ),
    'wallet-trading-sell': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/sell/TradingSellForm'
        ).then(({ TradingSellForm }) => ({ default: TradingSellForm })),
    ),
    'wallet-trading-sell-detail': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/sell/TradingSellDetail'
        ).then(({ TradingSellDetail }) => ({ default: TradingSellDetail })),
    ),
    'wallet-trading-sell-offers': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/sell/TradingSellOffers'
        ).then(({ TradingSellOffers }) => ({ default: TradingSellOffers })),
    ),
    'wallet-trading-sell-confirm': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/sell/TradingSellConfirm'
        ).then(({ TradingSellConfirm }) => ({ default: TradingSellConfirm })),
    ),
    'wallet-trading-exchange': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/exchange/TradingExchangeForm'
        ).then(({ TradingExchangeForm }) => ({ default: TradingExchangeForm })),
    ),
    'wallet-trading-exchange-detail': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/exchange/TradingExchangeDetail'
        ).then(({ TradingExchangeDetail }) => ({ default: TradingExchangeDetail })),
    ),
    'wallet-trading-exchange-offers': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/exchange/TradingExchangeOffers'
        ).then(({ TradingExchangeOffers }) => ({ default: TradingExchangeOffers })),
    ),
    'wallet-trading-exchange-confirm': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/exchange/TradingExchangeConfirm'
        ).then(({ TradingExchangeConfirm }) => ({ default: TradingExchangeConfirm })),
    ),
    'wallet-trading-concierge': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/concierge/TradingConciergeDetail'
        ).then(({ TradingConciergeDetail }) => ({ default: TradingConciergeDetail })),
    ),
    'wallet-trading-redirect': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/redirect/TradingRedirect'
        ).then(({ TradingRedirect }) => ({ default: TradingRedirect })),
    ),
    'wallet-trading-transactions': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ 'src/views/wallet/trading/transactions/TradingTransactions'
        ).then(({ TradingTransactions }) => ({ default: TradingTransactions })),
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
    'settings-connected-apps': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ 'src/views/settings/SettingsConnectedApps/SettingsConnectedApps'
        ).then(({ SettingsConnectedApps }) => ({ default: SettingsConnectedApps })),
    ),
};
