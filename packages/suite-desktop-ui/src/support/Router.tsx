import { memo, ComponentType } from 'react';
import { Switch, Route } from 'react-router-dom';

import { PageName } from '@suite-common/suite-types';

import routes from 'src/constants/suite/routes';
import { Dashboard } from 'src/views/dashboard';
import Notification from 'src/views/suite/notifications';
import { Transactions } from 'src/views/wallet/transactions/Transactions';
import { Receive } from 'src/views/wallet/receive/Receive';
import WalletDetails from 'src/views/wallet/details';
import WalletSend from 'src/views/wallet/send';
import { WalletStaking } from 'src/views/wallet/staking/WalletStaking';
import WalletSignVerify from 'src/views/wallet/sign-verify';
import WalletAnonymize from 'src/views/wallet/anonymize';
import { TradingBuyForm } from 'src/views/wallet/trading/buy/TradingBuyForm';
import { TradingBuyDetail } from 'src/views/wallet/trading/buy/TradingBuyDetail';
import { TradingBuyOffers } from 'src/views/wallet/trading/buy/TradingBuyOffers';
import { TradingBuyConfirm } from 'src/views/wallet/trading/buy/TradingBuyConfirm';
import { TradingSellForm } from 'src/views/wallet/trading/sell/TradingSellForm';
import { TradingSellDetail } from 'src/views/wallet/trading/sell/TradingSellDetail';
import { TradingSellOffers } from 'src/views/wallet/trading/sell/TradingSellOffers';
import { TradingSellConfirm } from 'src/views/wallet/trading/sell/TradingSellConfirm';
import { TradingExchangeForm } from 'src/views/wallet/trading/exchange/TradingExchangeForm';
import { TradingExchangeDetail } from 'src/views/wallet/trading/exchange/TradingExchangeDetail';
import { TradingExchangeOffers } from 'src/views/wallet/trading/exchange/TradingExchangeOffers';
import { TradingExchangeConfirm } from 'src/views/wallet/trading/exchange/TradingExchangeConfirm';
import { TradingDCALanding } from 'src/views/wallet/trading/DCA/TradingDCALanding';
import { TradingRedirect } from 'src/views/wallet/trading/redirect/TradingRedirect';
import { TradingTransactions } from 'src/views/wallet/trading/transactions/TradingTransactions';
import { SettingsGeneral } from 'src/views/settings/SettingsGeneral/SettingsGeneral';
import { SettingsCoins } from 'src/views/settings/SettingsCoins/SettingsCoins';
import { SettingsDebug } from 'src/views/settings/SettingsDebug/SettingsDebug';
import { SettingsDevice } from 'src/views/settings/SettingsDevice/SettingsDevice';
import { Tokens } from 'src/views/wallet/tokens';
import { Nfts } from 'src/views/wallet/nfts';
import PasswordManager from 'src/views/password-manager';

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
