import { type ComponentType } from 'react';

import { type PageName } from '@suite/router';

import { ConnectPopup } from 'src/views/connect-popup';
import { Dashboard } from 'src/views/dashboard';
import { Earn } from 'src/views/earn';
import {
    EarnTronClaim,
    EarnTronRedirect,
    EarnTronStake,
    EarnTronUnstake,
    EarnTronVote,
    EarnTronWithdraw,
} from 'src/views/earn/tron';
import { EarnClaim } from 'src/views/earn/yield/claim';
import { EarnDeposit } from 'src/views/earn/yield/deposit';
import { EarnUnwrap } from 'src/views/earn/yield/unwrap';
import { EarnWithdraw } from 'src/views/earn/yield/withdraw';
import { EarnWrap } from 'src/views/earn/yield/wrap';
import PasswordManagerView from 'src/views/password-manager';
import { SettingsCoins } from 'src/views/settings/SettingsCoins/SettingsCoins';
import { SettingsConnectedApps } from 'src/views/settings/SettingsConnectedApps/SettingsConnectedApps';
import { SettingsDebug } from 'src/views/settings/SettingsDebug/SettingsDebug';
import { SettingsDevice } from 'src/views/settings/SettingsDevice/SettingsDevice';
import { SettingsGeneral } from 'src/views/settings/SettingsGeneral/SettingsGeneral';
import Notification from 'src/views/suite/notifications';
import WalletAnonymize from 'src/views/wallet/anonymize';
import WalletDetails from 'src/views/wallet/details';
import { Nfts } from 'src/views/wallet/nfts';
import { Receive } from 'src/views/wallet/receive/Receive';
import WalletSend from 'src/views/wallet/send';
import { SignVerifyPage } from 'src/views/wallet/sign-verify/SignVerifyPage';
import { WalletStaking } from 'src/views/wallet/staking/WalletStaking';
import { Tokens } from 'src/views/wallet/tokens';
import { TradingBuyConfirm } from 'src/views/wallet/trading/buy/TradingBuyConfirm';
import { TradingBuyDetail } from 'src/views/wallet/trading/buy/TradingBuyDetail/TradingBuyDetail';
import { TradingBuyForm } from 'src/views/wallet/trading/buy/TradingBuyForm';
import { TradingConciergeDetail } from 'src/views/wallet/trading/concierge/TradingConciergeDetail';
import { TradingExchangeConfirm } from 'src/views/wallet/trading/exchange/TradingExchangeConfirm';
import { TradingExchangeDetail } from 'src/views/wallet/trading/exchange/TradingExchangeDetail/TradingExchangeDetail';
import { TradingExchangeForm } from 'src/views/wallet/trading/exchange/TradingExchangeForm';
import { TradingRedirect } from 'src/views/wallet/trading/redirect/TradingRedirect';
import { TradingSellConfirm } from 'src/views/wallet/trading/sell/TradingSellConfirm';
import { TradingSellDetail } from 'src/views/wallet/trading/sell/TradingSellDetail/TradingSellDetail';
import { TradingSellForm } from 'src/views/wallet/trading/sell/TradingSellForm';
import { TradingTransactions } from 'src/views/wallet/trading/transactions/TradingTransactions';
import { Transactions } from 'src/views/wallet/transactions/Transactions';

/*
 Note 1: Currently, this list contains the same components as webComponents.ts, but there could be Desktop-specific
 pages to avoid bundling Desktop code into @trezor/suite, which ends up in Web too.

 Note 2: Unlike Web, we don't use code-splitting with dynamic JS bundle loading – on Desktop it'd be useless.
 There's an idea that on weak CPU, parsing & interpreting the JS bundle could be a limiting factor (code-splitting could help).
 But it was tested that this is negligible time. On weak CPU, code execution is the limiting factor (unaffected by code-splitting).
*/

export const desktopComponents: Record<PageName, ComponentType> = {
    'suite-index': Dashboard,
    'suite-earn': Earn,
    'earn-yield-deposit': EarnDeposit,
    'earn-yield-withdraw': EarnWithdraw,
    'earn-yield-claim': EarnClaim,
    'earn-yield-unwrap': EarnUnwrap,
    'earn-yield-wrap': EarnWrap,
    'earn-tron': EarnTronRedirect,
    'earn-tron-stake': EarnTronStake,
    'earn-tron-vote': EarnTronVote,
    'earn-tron-unstake': EarnTronUnstake,
    'earn-tron-withdraw': EarnTronWithdraw,
    'earn-tron-claim': EarnTronClaim,
    'suite-connect-popup': ConnectPopup,
    'notifications-index': Notification,

    'wallet-index': Transactions,
    'wallet-receive': Receive,
    'wallet-details': WalletDetails,
    'wallet-send': WalletSend,
    'wallet-staking': WalletStaking,
    'wallet-sign-verify': SignVerifyPage,
    'wallet-anonymize': WalletAnonymize,
    'wallet-tokens': Tokens,
    'wallet-nfts': Nfts,
    'wallet-trading-buy': TradingBuyForm,
    'wallet-trading-buy-detail': TradingBuyDetail,
    'wallet-trading-buy-confirm': TradingBuyConfirm,
    'wallet-trading-sell': TradingSellForm,
    'wallet-trading-sell-detail': TradingSellDetail,
    'wallet-trading-sell-confirm': TradingSellConfirm,
    'wallet-trading-exchange': TradingExchangeForm,
    'wallet-trading-exchange-detail': TradingExchangeDetail,
    'wallet-trading-exchange-confirm': TradingExchangeConfirm,
    'wallet-trading-concierge': TradingConciergeDetail,
    'wallet-trading-redirect': TradingRedirect,
    'wallet-trading-transactions': TradingTransactions,

    'password-manager-index': PasswordManagerView,

    'settings-index': SettingsGeneral,
    'settings-coins': SettingsCoins,
    'settings-debug': SettingsDebug,
    'settings-device': SettingsDevice,
    'settings-connected-apps': SettingsConnectedApps,
};
