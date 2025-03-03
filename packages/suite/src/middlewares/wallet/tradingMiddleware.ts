import { MiddlewareAPI } from 'redux';

import { INVITY_API_RELOAD_DATA_AFTER_MS, invityAPI } from '@suite-common/trading';

import { ROUTER } from 'src/actions/suite/constants';
import { TRADING_COMMON, TRADING_EXCHANGE, TRADING_SELL } from 'src/actions/wallet/constants';
import * as tradingCommonActions from 'src/actions/wallet/trading/tradingCommonActions';
import * as tradingBuyActions from 'src/actions/wallet/tradingBuyActions';
import * as tradingExchangeActions from 'src/actions/wallet/tradingExchangeActions';
import * as tradingInfoAction from 'src/actions/wallet/tradingInfoActions';
import * as tradingSellActions from 'src/actions/wallet/tradingSellActions';
import { Action, AppState, Dispatch } from 'src/types/suite';
import { getTradeTypeByRoute } from 'src/utils/wallet/trading/tradingUtils';

/**
 * In the Sell and Swap section an account can be changed by a user in the select
 */
export const getAccountAccordingToRoute = (state: AppState) => {
    const tradeType = getTradeTypeByRoute(state.router.route?.name);

    const {
        selectedAccount: { account },
        accounts,
        trading: {
            sell: { tradingAccountKey: sellSelectedAccountKey },
            exchange: { tradingAccountKey: exchangeSelectedAccountKey },
        },
    } = state.wallet;

    if (tradeType === 'sell' && sellSelectedAccountKey)
        return accounts.find(account => account.key === sellSelectedAccountKey);
    if (tradeType === 'exchange' && exchangeSelectedAccountKey)
        return accounts.find(account => account.key === exchangeSelectedAccountKey);

    return account;
};

export const tradingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const state = api.getState();
        const { isLoading, lastLoadedTimestamp, modalAccountKey } = state.wallet.trading;
        const { exchangeInfo } = state.wallet.trading.exchange;
        const { sellInfo } = state.wallet.trading.sell;
        const isRouteChange = action.type === ROUTER.LOCATION_CHANGE;

        if (action.type === TRADING_COMMON.LOAD_DATA) {
            const account = getAccountAccordingToRoute(state);
            const { platforms, coins } = state.wallet.trading.info;
            const { buyInfo } = state.wallet.trading.buy;

            const currentAccountDescriptor = invityAPI.getCurrentAccountDescriptor();
            const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;

            if (
                account &&
                !isLoading &&
                (isDifferentAccount ||
                    lastLoadedTimestamp + INVITY_API_RELOAD_DATA_AFTER_MS < Date.now())
            ) {
                api.dispatch(tradingCommonActions.setLoading(true));

                const { invityServerEnvironment } = state.suite.settings.debug;
                if (invityServerEnvironment) {
                    invityAPI.setInvityServersEnvironment(invityServerEnvironment);
                }

                const tradeType = getTradeTypeByRoute(state.router.route?.name);
                if (tradeType) {
                    api.dispatch(tradingCommonActions.setActiveSection(tradeType));
                }

                invityAPI.createInvityAPIKey(account.descriptor);

                const loadPromises: Promise<void>[] = [];

                if (isDifferentAccount || !platforms || !coins) {
                    loadPromises.push(
                        invityAPI.getInfo().then(info => {
                            api.dispatch(tradingInfoAction.saveInfo(info));
                        }),
                    );
                }

                if (isDifferentAccount || !buyInfo) {
                    loadPromises.push(
                        tradingBuyActions.loadBuyInfo().then(buyInfo => {
                            api.dispatch(tradingBuyActions.saveBuyInfo(buyInfo));
                        }),
                    );
                }

                if (isDifferentAccount || !exchangeInfo) {
                    loadPromises.push(
                        tradingExchangeActions.loadExchangeInfo().then(exchangeInfo => {
                            api.dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfo));
                        }),
                    );
                }

                if (isDifferentAccount || !sellInfo) {
                    loadPromises.push(
                        tradingSellActions.loadSellInfo().then(sellInfo => {
                            api.dispatch(tradingSellActions.saveSellInfo(sellInfo));
                        }),
                    );
                }

                Promise.all(loadPromises)
                    .then(() => api.dispatch(tradingCommonActions.setLoading(false, Date.now())))
                    .catch(() => api.dispatch(tradingCommonActions.setLoading(false)));
            }
        }

        next(action);

        // get the new state after the action has been processed
        const newState = api.getState();

        if (isRouteChange) {
            const routeName = newState.router.route?.name;
            const isTradingRoute = !!routeName?.includes('wallet-trading');
            const isBuy = routeName === 'wallet-trading-buy';
            const isSell = routeName === 'wallet-trading-sell';
            const isExchange = routeName === 'wallet-trading-exchange';

            // it is necessary to clear the state because it could affect the other modal state
            if (!isTradingRoute && modalAccountKey) {
                api.dispatch(tradingCommonActions.setTradingModalAccountKey(undefined));
            }

            if (isBuy) {
                api.dispatch(tradingCommonActions.setActiveSection('buy'));
                api.dispatch(tradingBuyActions.saveTransactionDetailId(undefined));
            }

            if (isSell) {
                api.dispatch(tradingCommonActions.setActiveSection('sell'));
                api.dispatch(tradingSellActions.saveTransactionId(undefined));
            }

            if (isExchange) {
                api.dispatch(tradingCommonActions.setActiveSection('exchange'));
                api.dispatch(tradingExchangeActions.saveTransactionId(undefined));
            }

            const wasBuy = state.router.route?.name === 'wallet-trading-buy';
            const wasSell = state.router.route?.name === 'wallet-trading-sell';
            const isBuyToSell = wasBuy && isSell;
            const isSellToBuy = wasSell && isBuy;

            const cleanupPrefilledFromCryptoId =
                !!newState.wallet.trading.prefilledFromCryptoId &&
                ((!isSell && !isExchange && !isBuy) || isBuyToSell || isSellToBuy);

            if (cleanupPrefilledFromCryptoId) {
                api.dispatch(tradingCommonActions.setTradingPrefilledFromCryptoId(undefined));
            }
        }

        // after an account change in the Sell or Swap update the invityAPIKey based on the account
        if (
            action.type === TRADING_EXCHANGE.SET_TRADING_ACCOUNT_KEY ||
            action.type === TRADING_SELL.SET_TRADING_ACCOUNT_KEY
        ) {
            const account = getAccountAccordingToRoute(newState);

            if (account) {
                invityAPI.createInvityAPIKey(account.descriptor);
            }
        }

        return action;
    };
