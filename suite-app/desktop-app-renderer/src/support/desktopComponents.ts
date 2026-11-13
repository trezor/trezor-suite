import { type ComponentType } from 'react';

import { type PageName } from '@suite/router';
import { NftsPage, TokensPage, WalletDetailsPage } from '@suite-app/module-account-detail';
import { NotificationPage } from '@suite-app/module-activity-center';
import { AppsEmbeddingPage } from '@suite-app/module-apps-embedding';
import { AssetDetailPage } from '@suite-app/module-assets';
import { WalletAnonymizePage, WalletCoinjoinPage } from '@suite-app/module-coinjoin';
import { ConnectPopupPage } from '@suite-app/module-connect-popup';
import {
    EarnClaimPage,
    EarnDepositPage,
    EarnPage,
    EarnTronClaimPage,
    EarnTronRedirectPage,
    EarnTronStakePage,
    EarnTronUnstakePage,
    EarnTronVotePage,
    EarnTronWithdrawPage,
    EarnUnwrapPage,
    EarnWithdrawPage,
    EarnWrapPage,
    WalletStakingPage,
} from '@suite-app/module-earn';
import { DashboardPage, HiddenTokensPage } from '@suite-app/module-home';
import { PasswordManagerPage } from '@suite-app/module-password-manager';
import { ReceivePage } from '@suite-app/module-receive';
import { ReferAFriendPage } from '@suite-app/module-refer-a-friend';
import { WalletSendPage } from '@suite-app/module-send';
import {
    DesktopSettingsGeneralPage,
    SettingsCoinsPage,
    SettingsConnectedAppsPage,
    SettingsDebugPage,
    SettingsDevicePage,
} from '@suite-app/module-settings';
import { SignVerifyPage } from '@suite-app/module-sign-verify';
import {
    TradingBuyConfirmPage,
    TradingBuyDetailPage,
    TradingBuyFormPage,
    TradingConciergeDetailPage,
    TradingExchangeApprovalPage,
    TradingExchangeConfirmPage,
    TradingExchangeDetailPage,
    TradingExchangeFormPage,
    TradingRedirectPage,
    TradingSellConfirmPage,
    TradingSellDetailPage,
    TradingSellFormPage,
    TradingTransactionsPage,
    WalletTradePage,
} from '@suite-app/module-trading';
import { AccountOverviewPage } from '@suite-app/module-transactions';

/*
 Note 1: Currently, this list contains the same components as webComponents.ts, but there could be Desktop-specific
 pages to avoid bundling Desktop code into @trezor/suite, which ends up in Web too.

 Note 2: Unlike Web, we don't use code-splitting with dynamic JS bundle loading – on Desktop it'd be useless.
 There's an idea that on weak CPU, parsing & interpreting the JS bundle could be a limiting factor (code-splitting could help).
 But it was tested that this is negligible time. On weak CPU, code execution is the limiting factor (unaffected by code-splitting).
*/

export const desktopComponents: Record<PageName, ComponentType> = {
    'suite-index': DashboardPage,
    /*
     Compatibility fallback after removing the `suite-start` as a fullscreen app.
     It used to be a route dedicated as a starting point for onboarding devices.
     Now that screen is rendered declaratively so we don't need a route for it.
    */
    // TODO add a redirect option to routeConfig instead of duplication.
    'suite-start': DashboardPage,
    'suite-hidden-tokens': HiddenTokensPage,
    'suite-asset': AssetDetailPage,
    'suite-earn': EarnPage,
    'suite-refer-a-friend': ReferAFriendPage,
    'earn-yield-deposit': EarnDepositPage,
    'earn-yield-withdraw': EarnWithdrawPage,
    'earn-yield-claim': EarnClaimPage,
    'earn-yield-unwrap': EarnUnwrapPage,
    'earn-yield-wrap': EarnWrapPage,
    'earn-tron': EarnTronRedirectPage,
    'earn-tron-stake': EarnTronStakePage,
    'earn-tron-vote': EarnTronVotePage,
    'earn-tron-unstake': EarnTronUnstakePage,
    'earn-tron-withdraw': EarnTronWithdrawPage,
    'earn-tron-claim': EarnTronClaimPage,
    'apps-embedding-index': AppsEmbeddingPage,
    'suite-connect-popup': ConnectPopupPage,
    'notifications-index': NotificationPage,

    'wallet-index': AccountOverviewPage,
    'wallet-receive': ReceivePage,
    'wallet-details': WalletDetailsPage,
    // Debug only: trading form embed preview
    'wallet-trade': WalletTradePage,
    'wallet-send': WalletSendPage,
    'wallet-staking': WalletStakingPage,
    'wallet-sign-verify': SignVerifyPage,
    'wallet-anonymize': WalletAnonymizePage,
    'wallet-coinjoin': WalletCoinjoinPage,
    'wallet-tokens': TokensPage,
    'wallet-nfts': NftsPage,
    'wallet-trading-buy': TradingBuyFormPage,
    'wallet-trading-buy-detail': TradingBuyDetailPage,
    'wallet-trading-buy-confirm': TradingBuyConfirmPage,
    'wallet-trading-sell': TradingSellFormPage,
    'wallet-trading-sell-detail': TradingSellDetailPage,
    'wallet-trading-sell-confirm': TradingSellConfirmPage,
    'wallet-trading-exchange': TradingExchangeFormPage,
    'wallet-trading-exchange-detail': TradingExchangeDetailPage,
    'wallet-trading-exchange-confirm': TradingExchangeConfirmPage,
    'wallet-trading-exchange-approval': TradingExchangeApprovalPage,
    'wallet-trading-concierge': TradingConciergeDetailPage,
    'wallet-trading-redirect': TradingRedirectPage,
    'wallet-trading-transactions': TradingTransactionsPage,

    'password-manager-index': PasswordManagerPage,

    'settings-index': DesktopSettingsGeneralPage,
    'settings-coins': SettingsCoinsPage,
    'settings-debug': SettingsDebugPage,
    'settings-device': SettingsDevicePage,
    'settings-connected-apps': SettingsConnectedAppsPage,
};
