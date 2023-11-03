import { memo, ComponentType } from 'react';
import { Switch, Route } from 'react-router-dom';

import { PageName } from '@suite-common/suite-types';

import routes from 'src/constants/suite/routes';
import Index from 'src/views/dashboard';
import Notification from 'src/views/suite/notifications';
import { Transactions } from 'src/views/wallet/transactions/Transactions';
import WalletReceive from 'src/views/wallet/receive';
import WalletDetails from 'src/views/wallet/details';
import WalletTokens from 'src/views/wallet/tokens';
import WalletSend from 'src/views/wallet/send';
import { WalletStaking } from 'src/views/wallet/staking/WalletStaking';
import WalletSignVerify from 'src/views/wallet/sign-verify';
import WalletAnonymize from 'src/views/wallet/anonymize';
import WalletCoinmarketBuy from 'src/views/wallet/coinmarket/buy';
import WalletCoinmarketBuyDetail from 'src/views/wallet/coinmarket/buy/detail';
import WalletCoinmarketBuyOffers from 'src/views/wallet/coinmarket/buy/offers';
import WalletCoinmarketSell from 'src/views/wallet/coinmarket/sell';
import WalletCoinmarketSellDetail from 'src/views/wallet/coinmarket/sell/detail';
import WalletCoinmarketSellOffers from 'src/views/wallet/coinmarket/sell/offers';
import WalletCoinmarketExchange from 'src/views/wallet/coinmarket/exchange';
import WalletCoinmarketExchangeDetail from 'src/views/wallet/coinmarket/exchange/detail';
import WalletCoinmarketExchangeOffers from 'src/views/wallet/coinmarket/exchange/offers';
import WalletCoinmarketSpend from 'src/views/wallet/coinmarket/spend';
import WalletCoinmarketP2p from 'src/views/wallet/coinmarket/p2p/form';
import WalletCoinmarketP2pOffers from 'src/views/wallet/coinmarket/p2p/offers';
import WalletCoinmarketSavingsSetup from 'src/views/wallet/coinmarket/savings/setup';
import WalletCoinmarketSavingsSetupContinue from 'src/views/wallet/coinmarket/savings/setup/continue';
import WalletCoinmarketSavingsSetupWaiting from 'src/views/wallet/coinmarket/savings/setup/waiting';
import WalletCoinmarketSavingsPaymentInfo from 'src/views/wallet/coinmarket/savings/payment-info';
import WalletCoinmarketSavingsOverview from 'src/views/wallet/coinmarket/savings/overview';
import WalletCoinmarketRedirect from 'src/views/wallet/coinmarket/redirect';
import { SettingsGeneral } from 'src/views/settings/SettingsGeneral/SettingsGeneral';
import { SettingsCoins } from 'src/views/settings/SettingsCoins/SettingsCoins';
import { SettingsDebug } from 'src/views/settings/SettingsDebug/SettingsDebug';
import { SettingsDevice } from 'src/views/settings/SettingsDevice/SettingsDevice';

const components: Record<PageName, ComponentType<any>> = {
    'suite-index': Index,
    'notifications-index': Notification,

    'wallet-index': Transactions,
    'wallet-receive': WalletReceive,
    'wallet-details': WalletDetails,
    'wallet-tokens': WalletTokens,
    'wallet-send': WalletSend,
    'wallet-staking': WalletStaking,
    'wallet-sign-verify': WalletSignVerify,
    'wallet-anonymize': WalletAnonymize,

    'wallet-coinmarket-buy': WalletCoinmarketBuy,
    'wallet-coinmarket-buy-detail': WalletCoinmarketBuyDetail,
    'wallet-coinmarket-buy-offers': WalletCoinmarketBuyOffers,
    'wallet-coinmarket-sell': WalletCoinmarketSell,
    'wallet-coinmarket-sell-detail': WalletCoinmarketSellDetail,
    'wallet-coinmarket-sell-offers': WalletCoinmarketSellOffers,
    'wallet-coinmarket-exchange': WalletCoinmarketExchange,
    'wallet-coinmarket-exchange-detail': WalletCoinmarketExchangeDetail,
    'wallet-coinmarket-exchange-offers': WalletCoinmarketExchangeOffers,
    'wallet-coinmarket-spend': WalletCoinmarketSpend,
    'wallet-coinmarket-p2p': WalletCoinmarketP2p,
    'wallet-coinmarket-p2p-offers': WalletCoinmarketP2pOffers,
    'wallet-coinmarket-savings-setup': WalletCoinmarketSavingsSetup,
    'wallet-coinmarket-savings-setup-continue': WalletCoinmarketSavingsSetupContinue,
    'wallet-coinmarket-savings-setup-waiting': WalletCoinmarketSavingsSetupWaiting,
    'wallet-coinmarket-savings-payment-info': WalletCoinmarketSavingsPaymentInfo,
    'wallet-coinmarket-savings-overview': WalletCoinmarketSavingsOverview,
    'wallet-coinmarket-redirect': WalletCoinmarketRedirect,

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
