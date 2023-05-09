import React, { memo } from 'react';
import { Switch, Route } from 'react-router-dom';

import routes from '@suite-constants/routes';
import Index from '@suite/views/dashboard';
import Notification from '@suite-views/notifications';
import { Transactions } from '@wallet-views/transactions/Transactions';
import WalletReceive from '@wallet-views/receive';
import WalletDetails from '@wallet-views/details';
import WalletTokens from '@wallet-views/tokens';
import WalletSend from '@wallet-views/send';
import { WalletStaking } from '@wallet-views/staking/WalletStaking';
import WalletSignVerify from '@wallet-views/sign-verify';
import WalletAnonymize from '@wallet-views/anonymize';
import WalletCoinmarketBuy from '@wallet-views/coinmarket/buy';
import WalletCoinmarketBuyDetail from '@wallet-views/coinmarket/buy/detail';
import WalletCoinmarketBuyOffers from '@wallet-views/coinmarket/buy/offers';
import WalletCoinmarketSell from '@wallet-views/coinmarket/sell';
import WalletCoinmarketSellDetail from '@wallet-views/coinmarket/sell/detail';
import WalletCoinmarketSellOffers from '@wallet-views/coinmarket/sell/offers';
import WalletCoinmarketExchange from '@wallet-views/coinmarket/exchange';
import WalletCoinmarketExchangeDetail from '@wallet-views/coinmarket/exchange/detail';
import WalletCoinmarketExchangeOffers from '@wallet-views/coinmarket/exchange/offers';
import WalletCoinmarketSpend from '@wallet-views/coinmarket/spend';
import WalletCoinmarketP2p from '@wallet-views/coinmarket/p2p/form';
import WalletCoinmarketP2pOffers from '@wallet-views/coinmarket/p2p/offers';
import WalletCoinmarketSavingsSetup from '@wallet-views/coinmarket/savings/setup';
import WalletCoinmarketSavingsSetupContinue from '@wallet-views/coinmarket/savings/setup/continue';
import WalletCoinmarketSavingsSetupWaiting from '@wallet-views/coinmarket/savings/setup/waiting';
import WalletCoinmarketSavingsPaymentInfo from '@wallet-views/coinmarket/savings/payment-info';
import WalletCoinmarketSavingsOverview from '@wallet-views/coinmarket/savings/overview';
import WalletCoinmarketRedirect from '@wallet-views/coinmarket/redirect';
import { SettingsGeneral } from '@settings-views/general/SettingsGeneral';
import { SettingsCoins } from '@settings-views/coins/SettingsCoins';
import { SettingsDebug } from '@settings-views/debug/SettingsDebug';
import { SettingsDevice } from '@settings-views/device/SettingsDevice';

const components: { [key: string]: React.ComponentType<any> } = {
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
                component={components[route.name]}
            />
        ))}
    </Switch>
));
