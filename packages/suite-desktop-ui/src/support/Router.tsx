import { memo, ComponentType } from 'react';
import { Switch, Route } from 'react-router-dom';

import { PageName } from '@suite-common/suite-types';

import routes from 'src/constants/suite/routes';
import { Dashboard } from 'src/views/dashboard';
import Notification from 'src/views/suite/notifications';
import { Transactions } from 'src/views/wallet/transactions/Transactions';
import { Receive } from 'src/views/wallet/receive/Receive';
import WalletDetails from 'src/views/wallet/details';
import { Coins } from 'src/views/wallet/tokens/coins';
import { HiddenTokens } from 'src/views/wallet/tokens/hidden-tokens';
import WalletSend from 'src/views/wallet/send';
import { WalletStaking } from 'src/views/wallet/staking/WalletStaking';
import WalletSignVerify from 'src/views/wallet/sign-verify';
import WalletAnonymize from 'src/views/wallet/anonymize';
import { CoinmarketBuyForm } from 'src/views/wallet/coinmarket/buy/CoinmarketBuyForm';
import { CoinmarketBuyDetail } from 'src/views/wallet/coinmarket/buy/CoinmarketBuyDetail';
import { CoinmarketBuyOffers } from 'src/views/wallet/coinmarket/buy/CoinmarketBuyOffers';
import { CoinmarketBuyConfirm } from 'src/views/wallet/coinmarket/buy/CoinmarketBuyConfirm';
import { CoinmarketSellForm } from 'src/views/wallet/coinmarket/sell_new/CoinmarketSellForm';
import { CoinmarketSellDetail } from 'src/views/wallet/coinmarket/sell_new/CoinmarketSellDetail';
import { CoinmarketSellOffers } from 'src/views/wallet/coinmarket/sell_new/CoinmarketSellOffers';
import { CoinmarketSellConfirm } from 'src/views/wallet/coinmarket/sell_new/CoinmarketSellConfirm';
import { CoinmarketExchangeForm } from 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeForm';
import { CoinmarketExchangeDetail } from 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeDetail';
import { CoinmarketExchangeOffers } from 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeOffers';
import { CoinmarketExchangeConfirm } from 'src/views/wallet/coinmarket/exchange_new/CoinmarketExchangeConfirm';
import { CoinmarketDCALanding } from 'src/views/wallet/coinmarket/DCA/CoinmarketDCALanding';
import { CoinmarketRedirect } from 'src/views/wallet/coinmarket/redirect/CoinmarketRedirect';
import { CoinmarketTransactions } from 'src/views/wallet/coinmarket/transactions/CoinmarketTransactions';
import { SettingsGeneral } from 'src/views/settings/SettingsGeneral/SettingsGeneral';
import { SettingsCoins } from 'src/views/settings/SettingsCoins/SettingsCoins';
import { SettingsDebug } from 'src/views/settings/SettingsDebug/SettingsDebug';
import { SettingsDevice } from 'src/views/settings/SettingsDevice/SettingsDevice';
import PasswordManager from 'src/views/password-manager';

const components: { [key: string]: ComponentType<any> } = {
    'suite-index': Dashboard,
    'notifications-index': Notification,

    'wallet-index': Transactions,
    'wallet-receive': Receive,
    'wallet-details': WalletDetails,
    'wallet-tokens-coins': Coins,
    'wallet-tokens-hidden': HiddenTokens,
    'wallet-send': WalletSend,
    'wallet-staking': WalletStaking,
    'wallet-sign-verify': WalletSignVerify,
    'wallet-anonymize': WalletAnonymize,

    'wallet-coinmarket-buy': CoinmarketBuyForm,
    'wallet-coinmarket-buy-detail': CoinmarketBuyDetail,
    'wallet-coinmarket-buy-offers': CoinmarketBuyOffers,
    'wallet-coinmarket-buy-confirm': CoinmarketBuyConfirm,
    'wallet-coinmarket-sell': CoinmarketSellForm,
    'wallet-coinmarket-sell-detail': CoinmarketSellDetail,
    'wallet-coinmarket-sell-offers': CoinmarketSellOffers,
    'wallet-coinmarket-sell-confirm': CoinmarketSellConfirm,
    'wallet-coinmarket-exchange': CoinmarketExchangeForm,
    'wallet-coinmarket-exchange-detail': CoinmarketExchangeDetail,
    'wallet-coinmarket-exchange-offers': CoinmarketExchangeOffers,
    'wallet-coinmarket-exchange-confirm': CoinmarketExchangeConfirm,
    'wallet-coinmarket-dca': CoinmarketDCALanding,
    'wallet-coinmarket-redirect': CoinmarketRedirect,
    'wallet-coinmarket-transactions': CoinmarketTransactions,

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
