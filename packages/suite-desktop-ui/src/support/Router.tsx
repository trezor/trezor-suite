import { ComponentType, memo } from 'react';
import { Route, Switch } from 'react-router-dom';

import { PageName } from '@suite-common/suite-types';

import routes from 'src/constants/suite/routes';
import { Dashboard } from 'src/views/dashboard';
import PasswordManager from 'src/views/password-manager';
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
import WalletSignVerify from 'src/views/wallet/sign-verify';
import { WalletStaking } from 'src/views/wallet/staking/WalletStaking';
import { Tokens } from 'src/views/wallet/tokens';
import { TradingDCALanding } from 'src/views/wallet/trading/DCA/TradingDCALanding';
import { TradingBuyConfirm } from 'src/views/wallet/trading/buy/TradingBuyConfirm';
import { TradingBuyDetail } from 'src/views/wallet/trading/buy/TradingBuyDetail';
import { TradingBuyForm } from 'src/views/wallet/trading/buy/TradingBuyForm';
import { TradingBuyOffers } from 'src/views/wallet/trading/buy/TradingBuyOffers';
import { TradingExchangeConfirm } from 'src/views/wallet/trading/exchange/TradingExchangeConfirm';
import { TradingExchangeDetail } from 'src/views/wallet/trading/exchange/TradingExchangeDetail';
import { TradingExchangeForm } from 'src/views/wallet/trading/exchange/TradingExchangeForm';
import { TradingExchangeOffers } from 'src/views/wallet/trading/exchange/TradingExchangeOffers';
import { TradingRedirect } from 'src/views/wallet/trading/redirect/TradingRedirect';
import { TradingSellConfirm } from 'src/views/wallet/trading/sell/TradingSellConfirm';
import { TradingSellDetail } from 'src/views/wallet/trading/sell/TradingSellDetail';
import { TradingSellForm } from 'src/views/wallet/trading/sell/TradingSellForm';
import { TradingSellOffers } from 'src/views/wallet/trading/sell/TradingSellOffers';
import { TradingTransactions } from 'src/views/wallet/trading/transactions/TradingTransactions';
import { Transactions } from 'src/views/wallet/transactions/Transactions';

const components: { [key: string]: ComponentType<any> } = {
    'suite-index': Dashboard,
    'notifications-index': Notification,

    'wallet-index': Transactions,
    'wallet-receive': Receive,
    'wallet-details': WalletDetails,
    'wallet-send': WalletSend,
    'wallet-staking': WalletStaking,
    'wallet-sign-verify': WalletSignVerify,
    'wallet-anonymize': WalletAnonymize,
    'wallet-tokens': Tokens,
    'wallet-nfts': Nfts,
    'wallet-trading-buy': TradingBuyForm,
    'wallet-trading-buy-detail': TradingBuyDetail,
    'wallet-trading-buy-offers': TradingBuyOffers,
    'wallet-trading-buy-confirm': TradingBuyConfirm,
    'wallet-trading-sell': TradingSellForm,
    'wallet-trading-sell-detail': TradingSellDetail,
    'wallet-trading-sell-offers': TradingSellOffers,
    'wallet-trading-sell-confirm': TradingSellConfirm,
    'wallet-trading-exchange': TradingExchangeForm,
    'wallet-trading-exchange-detail': TradingExchangeDetail,
    'wallet-trading-exchange-offers': TradingExchangeOffers,
    'wallet-trading-exchange-confirm': TradingExchangeConfirm,
    'wallet-trading-dca': TradingDCALanding,
    'wallet-trading-redirect': TradingRedirect,
    'wallet-trading-transactions': TradingTransactions,

    'password-manager-index': PasswordManager,

    'settings-index': SettingsGeneral,
    'settings-coins': SettingsCoins,
    'settings-debug': SettingsDebug,
    'settings-device': SettingsDevice,
    'settings-connected-apps': SettingsConnectedApps,
};

export const AppRouter = memo(() => (
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
));
