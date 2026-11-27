import { type ComponentType } from 'react';

import { type PageName } from '@suite/router';
import { lazyComponentByName } from '@trezor/lazy-loading';
import { typedObjectTransformValues } from '@trezor/utils';

type WebPage = { LazyComponent: ComponentType; preload: () => void };

/** Each page in its own chunk, with the `preload` that `preloadInitialPage` starts during boot. */
export const webPages: Record<PageName, WebPage> = {
    'suite-refer-a-friend': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "refer-a-friend" */ '@suite-app/module-refer-a-friend/pages/ReferAFriendPage'
            ),
        'ReferAFriendPage',
    ),
    'suite-index': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "dashboard" */ '@suite-app/module-home/pages/DashboardPage'
            ),
        'DashboardPage',
    ),
    /*
     Compatibility fallback after removing the `suite-start` as a fullscreen app.
     It used to be a route dedicated as a starting point for onboarding devices.
     Now that screen is rendered declaratively so we don't need a route for it.
    */
    // TODO add a redirect option to routeConfig instead of duplication.
    'suite-start': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "dashboard" */ '@suite-app/module-home/pages/DashboardPage'
            ),
        'DashboardPage',
    ),
    'suite-hidden-tokens': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "dashboard" */ '@suite-app/module-home/pages/HiddenTokensPage'
            ),
        'HiddenTokensPage',
    ),
    'suite-asset': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "dashboard" */ '@suite-app/module-assets/pages/AssetDetailPage'
            ),
        'AssetDetailPage',
    ),
    'suite-earn': lazyComponentByName(
        () => import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnPage'),
        'EarnPage',
    ),
    'earn-positions': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnPositionsPage'),
        'EarnPositionsPage',
    ),
    'earn-yield-deposit': lazyComponentByName(
        () => import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnDepositPage'),
        'EarnDepositPage',
    ),
    'earn-yield-withdraw': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnWithdrawPage'),
        'EarnWithdrawPage',
    ),
    'earn-yield-claim': lazyComponentByName(
        () => import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnClaimPage'),
        'EarnClaimPage',
    ),
    'earn-yield-unwrap': lazyComponentByName(
        () => import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnUnwrapPage'),
        'EarnUnwrapPage',
    ),
    'earn-yield-wrap': lazyComponentByName(
        () => import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnWrapPage'),
        'EarnWrapPage',
    ),
    'earn-yield-vault': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnYieldVaultPage'
            ),
        'EarnYieldVaultPage',
    ),
    'earn-tron': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnTronRedirectPage'
            ),
        'EarnTronRedirectPage',
    ),
    'earn-tron-stake': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnTronStakePage'),
        'EarnTronStakePage',
    ),
    'earn-tron-vote': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnTronVotePage'),
        'EarnTronVotePage',
    ),
    'earn-tron-unstake': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnTronUnstakePage'
            ),
        'EarnTronUnstakePage',
    ),
    'earn-tron-withdraw': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnTronWithdrawPage'
            ),
        'EarnTronWithdrawPage',
    ),
    'earn-tron-claim': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "earn" */ '@suite-app/module-earn/pages/EarnTronClaimPage'),
        'EarnTronClaimPage',
    ),
    'apps-embedding-index': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "apps-embedding" */ '@suite-app/module-apps-embedding/pages/AppsEmbeddingPage'
            ),
        'AppsEmbeddingPage',
    ),
    'suite-connect-popup': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "connect-popup" */ '@suite-app/module-connect-popup/pages/ConnectPopupPage'
            ),
        'ConnectPopupPage',
    ),
    'notifications-index': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "notifications" */ '@suite-app/module-activity-center/pages/NotificationPage'
            ),
        'NotificationPage',
    ),

    // wallet
    'wallet-index': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-transactions/pages/AccountOverviewPage'
            ),
        'AccountOverviewPage',
    ),
    'wallet-receive': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "wallet" */ '@suite-app/module-receive/pages/ReceivePage'),
        'ReceivePage',
    ),
    'wallet-details': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-account-detail/pages/WalletDetailsPage'
            ),
        'WalletDetailsPage',
    ),
    // Debug only: trading form embed preview
    'wallet-trade': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-trading/pages/WalletTradePage'
            ),
        'WalletTradePage',
    ),
    'wallet-tokens': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-account-detail/pages/TokensPage'
            ),
        'TokensPage',
    ),
    'wallet-nfts': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-account-detail/pages/NftsPage'
            ),
        'NftsPage',
    ),
    'wallet-send': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "wallet" */ '@suite-app/module-send/pages/WalletSendPage'),
        'WalletSendPage',
    ),
    'wallet-staking': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-earn/pages/WalletStakingPage'
            ),
        'WalletStakingPage',
    ),
    'wallet-sign-verify': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-sign-verify/pages/SignVerifyPage'
            ),
        'SignVerifyPage',
    ),
    'wallet-anonymize': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-coinjoin/pages/WalletAnonymizePage'
            ),
        'WalletAnonymizePage',
    ),
    'wallet-coinjoin': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "wallet" */ '@suite-app/module-coinjoin/pages/WalletCoinjoinPage'
            ),
        'WalletCoinjoinPage',
    ),

    // trading
    'wallet-trading-buy': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingBuyFormPage'
            ),
        'TradingBuyFormPage',
    ),
    'wallet-trading-buy-detail': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingBuyDetailPage'
            ),
        'TradingBuyDetailPage',
    ),
    'wallet-trading-buy-confirm': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingBuyConfirmPage'
            ),
        'TradingBuyConfirmPage',
    ),
    'wallet-trading-sell': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingSellFormPage'
            ),
        'TradingSellFormPage',
    ),
    'wallet-trading-sell-detail': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingSellDetailPage'
            ),
        'TradingSellDetailPage',
    ),
    'wallet-trading-sell-confirm': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingSellConfirmPage'
            ),
        'TradingSellConfirmPage',
    ),
    'wallet-trading-exchange': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingExchangeFormPage'
            ),
        'TradingExchangeFormPage',
    ),
    'wallet-trading-exchange-detail': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingExchangeDetailPage'
            ),
        'TradingExchangeDetailPage',
    ),
    'wallet-trading-exchange-confirm': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingExchangeConfirmPage'
            ),
        'TradingExchangeConfirmPage',
    ),
    'wallet-trading-exchange-approval': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingExchangeApprovalPage'
            ),
        'TradingExchangeApprovalPage',
    ),
    'wallet-trading-exchange-allowance': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingExchangeAllowancePage'
            ),
        'TradingExchangeAllowancePage',
    ),
    'wallet-trading-concierge': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingConciergeDetailPage'
            ),
        'TradingConciergeDetailPage',
    ),
    'wallet-trading-redirect': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingRedirectPage'
            ),
        'TradingRedirectPage',
    ),
    'wallet-trading-transactions': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "trading" */ '@suite-app/module-trading/pages/TradingTransactionsPage'
            ),
        'TradingTransactionsPage',
    ),

    // password-manager
    'password-manager-index': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "password-manager" */ '@suite-app/module-password-manager/pages/PasswordManagerPage'
            ),
        'PasswordManagerPage',
    ),

    // settings
    'settings-index': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "settings" */ '@suite-app/module-settings/pages/WebSettingsGeneralPage'
            ),
        'WebSettingsGeneralPage',
    ),
    'settings-coins': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "settings" */ '@suite-app/module-settings/pages/SettingsCoinsPage'
            ),
        'SettingsCoinsPage',
    ),
    'settings-debug': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "settings" */ '@suite-app/module-settings/pages/SettingsDebugPage'
            ),
        'SettingsDebugPage',
    ),
    'settings-device': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "settings" */ '@suite-app/module-settings/pages/SettingsDevicePage'
            ),
        'SettingsDevicePage',
    ),
    'settings-connected-apps': lazyComponentByName(
        () =>
            import(
                /* webpackChunkName: "settings" */ '@suite-app/module-settings/pages/SettingsConnectedAppsPage'
            ),
        'SettingsConnectedAppsPage',
    ),
};

export const webComponents = typedObjectTransformValues(webPages, page => page.LazyComponent);
