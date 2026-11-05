import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

import { type PageName } from '@suite/router';

export const webComponents: Record<PageName, LazyExoticComponent<ComponentType>> = {
    'suite-refer-a-friend': lazy(() =>
        import(
            /* webpackChunkName: "refer-a-friend" */ '@suite-app/app/pages/ReferAFriendPage'
        ).then(({ ReferAFriendPage }) => ({ default: ReferAFriendPage })),
    ),
    'suite-index': lazy(() =>
        import(/* webpackChunkName: "dashboard" */ '@suite-app/app/pages/DashboardPage').then(
            ({ DashboardPage }) => ({ default: DashboardPage }),
        ),
    ),
    /*
     Compatibility fallback after removing the `suite-start` as a fullscreen app.
     It used to be a route dedicated as a starting point for onboarding devices.
     Now that screen is rendered declaratively so we don't need a route for it.
    */
    // TODO add a redirect option to routeConfig instead of duplication.
    'suite-start': lazy(() =>
        import(/* webpackChunkName: "dashboard" */ '@suite-app/app/pages/DashboardPage').then(
            ({ DashboardPage }) => ({ default: DashboardPage }),
        ),
    ),
    'suite-hidden-tokens': lazy(() =>
        import(/* webpackChunkName: "dashboard" */ '@suite-app/app/pages/HiddenTokensPage').then(
            ({ HiddenTokensPage }) => ({ default: HiddenTokensPage }),
        ),
    ),
    'suite-asset': lazy(() =>
        import(/* webpackChunkName: "dashboard" */ '@suite-app/app/pages/AssetDetailPage').then(
            ({ AssetDetailPage }) => ({ default: AssetDetailPage }),
        ),
    ),
    'suite-earn': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnPage').then(
            ({ EarnPage }) => ({
                default: EarnPage,
            }),
        ),
    ),
    'earn-yield-deposit': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnDepositPage').then(
            ({ EarnDepositPage }) => ({
                default: EarnDepositPage,
            }),
        ),
    ),
    'earn-yield-withdraw': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnWithdrawPage').then(
            ({ EarnWithdrawPage }) => ({
                default: EarnWithdrawPage,
            }),
        ),
    ),
    'earn-yield-claim': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnClaimPage').then(
            ({ EarnClaimPage }) => ({
                default: EarnClaimPage,
            }),
        ),
    ),
    'earn-yield-unwrap': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnUnwrapPage').then(
            ({ EarnUnwrapPage }) => ({
                default: EarnUnwrapPage,
            }),
        ),
    ),
    'earn-yield-wrap': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnWrapPage').then(
            ({ EarnWrapPage }) => ({
                default: EarnWrapPage,
            }),
        ),
    ),
    'earn-tron': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnTronRedirectPage').then(
            ({ EarnTronRedirectPage }) => ({
                default: EarnTronRedirectPage,
            }),
        ),
    ),
    'earn-tron-stake': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnTronStakePage').then(
            ({ EarnTronStakePage }) => ({
                default: EarnTronStakePage,
            }),
        ),
    ),
    'earn-tron-vote': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnTronVotePage').then(
            ({ EarnTronVotePage }) => ({
                default: EarnTronVotePage,
            }),
        ),
    ),
    'earn-tron-unstake': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnTronUnstakePage').then(
            ({ EarnTronUnstakePage }) => ({
                default: EarnTronUnstakePage,
            }),
        ),
    ),
    'earn-tron-withdraw': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnTronWithdrawPage').then(
            ({ EarnTronWithdrawPage }) => ({
                default: EarnTronWithdrawPage,
            }),
        ),
    ),
    'earn-tron-claim': lazy(() =>
        import(/* webpackChunkName: "earn" */ '@suite-app/app/pages/EarnTronClaimPage').then(
            ({ EarnTronClaimPage }) => ({
                default: EarnTronClaimPage,
            }),
        ),
    ),
    'apps-embedding-index': lazy(() =>
        import(
            /* webpackChunkName: "apps-embedding" */ '@suite-app/app/pages/AppsEmbeddingPage'
        ).then(({ AppsEmbeddingPage }) => ({ default: AppsEmbeddingPage })),
    ),
    'suite-connect-popup': lazy(() =>
        import(
            /* webpackChunkName: "connect-popup" */ '@suite-app/app/pages/ConnectPopupPage'
        ).then(({ ConnectPopupPage }) => ({ default: ConnectPopupPage })),
    ),
    'notifications-index': lazy(() =>
        import(
            /* webpackChunkName: "notifications" */ '@suite-app/app/pages/NotificationPage'
        ).then(({ NotificationPage }) => ({ default: NotificationPage })),
    ),

    // wallet
    'wallet-index': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/TransactionsPage').then(
            ({ TransactionsPage }) => ({ default: TransactionsPage }),
        ),
    ),
    'wallet-receive': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/ReceivePage').then(
            ({ ReceivePage }) => ({ default: ReceivePage }),
        ),
    ),
    'wallet-details': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/WalletDetailsPage').then(
            ({ WalletDetailsPage }) => ({ default: WalletDetailsPage }),
        ),
    ),
    // Debug only: trading form embed preview
    'wallet-trade': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/WalletTradePage').then(
            ({ WalletTradePage }) => ({ default: WalletTradePage }),
        ),
    ),
    'wallet-tokens': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/TokensPage').then(
            ({ TokensPage }) => ({ default: TokensPage }),
        ),
    ),
    'wallet-nfts': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/NftsPage').then(
            ({ NftsPage }) => ({
                default: NftsPage,
            }),
        ),
    ),
    'wallet-send': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/WalletSendPage').then(
            ({ WalletSendPage }) => ({ default: WalletSendPage }),
        ),
    ),
    'wallet-staking': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/WalletStakingPage').then(
            ({ WalletStakingPage }) => ({ default: WalletStakingPage }),
        ),
    ),
    'wallet-sign-verify': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/SignVerifyPage').then(
            ({ SignVerifyPage }) => ({ default: SignVerifyPage }),
        ),
    ),
    'wallet-anonymize': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/WalletAnonymizePage').then(
            ({ WalletAnonymizePage }) => ({ default: WalletAnonymizePage }),
        ),
    ),
    'wallet-coinjoin': lazy(() =>
        import(/* webpackChunkName: "wallet" */ '@suite-app/app/pages/WalletCoinjoinPage').then(
            ({ WalletCoinjoinPage }) => ({ default: WalletCoinjoinPage }),
        ),
    ),

    // trading
    'wallet-trading-buy': lazy(() =>
        import(/* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingBuyFormPage').then(
            ({ TradingBuyFormPage }) => ({ default: TradingBuyFormPage }),
        ),
    ),
    'wallet-trading-buy-detail': lazy(() =>
        import(/* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingBuyDetailPage').then(
            ({ TradingBuyDetailPage }) => ({ default: TradingBuyDetailPage }),
        ),
    ),
    'wallet-trading-buy-confirm': lazy(() =>
        import(/* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingBuyConfirmPage').then(
            ({ TradingBuyConfirmPage }) => ({ default: TradingBuyConfirmPage }),
        ),
    ),
    'wallet-trading-sell': lazy(() =>
        import(/* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingSellFormPage').then(
            ({ TradingSellFormPage }) => ({ default: TradingSellFormPage }),
        ),
    ),
    'wallet-trading-sell-detail': lazy(() =>
        import(/* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingSellDetailPage').then(
            ({ TradingSellDetailPage }) => ({ default: TradingSellDetailPage }),
        ),
    ),
    'wallet-trading-sell-confirm': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingSellConfirmPage'
        ).then(({ TradingSellConfirmPage }) => ({ default: TradingSellConfirmPage })),
    ),
    'wallet-trading-exchange': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingExchangeFormPage'
        ).then(({ TradingExchangeFormPage }) => ({
            default: TradingExchangeFormPage,
        })),
    ),
    'wallet-trading-exchange-detail': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingExchangeDetailPage'
        ).then(({ TradingExchangeDetailPage }) => ({
            default: TradingExchangeDetailPage,
        })),
    ),
    'wallet-trading-exchange-confirm': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingExchangeConfirmPage'
        ).then(({ TradingExchangeConfirmPage }) => ({
            default: TradingExchangeConfirmPage,
        })),
    ),
    'wallet-trading-exchange-approval': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingExchangeApprovalPage'
        ).then(({ TradingExchangeApprovalPage }) => ({
            default: TradingExchangeApprovalPage,
        })),
    ),
    'wallet-trading-exchange-allowance': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingExchangeAllowancePage'
        ).then(({ TradingExchangeAllowancePage }) => ({
            default: TradingExchangeAllowancePage,
        })),
    ),
    'wallet-trading-concierge': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingConciergeDetailPage'
        ).then(({ TradingConciergeDetailPage }) => ({
            default: TradingConciergeDetailPage,
        })),
    ),
    'wallet-trading-redirect': lazy(() =>
        import(/* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingRedirectPage').then(
            ({ TradingRedirectPage }) => ({ default: TradingRedirectPage }),
        ),
    ),
    'wallet-trading-transactions': lazy(() =>
        import(
            /* webpackChunkName: "trading" */ '@suite-app/app/pages/TradingTransactionsPage'
        ).then(({ TradingTransactionsPage }) => ({
            default: TradingTransactionsPage,
        })),
    ),

    // password-manager
    'password-manager-index': lazy(() =>
        import(
            /* webpackChunkName: "password-manager" */ '@suite-app/app/pages/PasswordManagerPage'
        ).then(({ PasswordManagerPage }) => ({
            default: PasswordManagerPage,
        })),
    ),

    // settings
    'settings-index': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ '@suite-app/app/pages/WebSettingsGeneralPage'
        ).then(({ WebSettingsGeneralPage }) => ({ default: WebSettingsGeneralPage })),
    ),
    'settings-coins': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@suite-app/app/pages/SettingsCoinsPage').then(
            ({ SettingsCoinsPage }) => ({ default: SettingsCoinsPage }),
        ),
    ),
    'settings-debug': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@suite-app/app/pages/SettingsDebugPage').then(
            ({ SettingsDebugPage }) => ({ default: SettingsDebugPage }),
        ),
    ),
    'settings-device': lazy(() =>
        import(/* webpackChunkName: "settings" */ '@suite-app/app/pages/SettingsDevicePage').then(
            ({ SettingsDevicePage }) => ({ default: SettingsDevicePage }),
        ),
    ),
    'settings-connected-apps': lazy(() =>
        import(
            /* webpackChunkName: "settings" */ '@suite-app/app/pages/SettingsConnectedAppsPage'
        ).then(({ SettingsConnectedAppsPage }) => ({
            default: SettingsConnectedAppsPage,
        })),
    ),
};
