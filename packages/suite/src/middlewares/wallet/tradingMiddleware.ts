import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { selectFullSelectedAccount } from '@suite/account';
import { type Route, routerLocationChange, selectRouteName } from '@suite/router';
import {
    selectTradingAccountAccordingActiveSection,
    selectTradingAccountKeyByTradeType,
    selectTradingActiveSection,
    selectTradingModalAccountKey,
    selectTradingPrefilledFromAccount,
    tradeApi,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { type AppState } from 'src/types/suite';

const TRADING_ENTRY_ROUTES: Route['name'][] = [
    'wallet-trading-buy',
    'wallet-trading-sell',
    'wallet-trading-exchange',
    'wallet-trading-redirect',
];

const isTradingSectionRoute = (routeName: Route['name'] | undefined): boolean =>
    !!routeName && TRADING_ENTRY_ROUTES.some(entryRoute => routeName.startsWith(entryRoute));

const isTradingEntryRoute = (routeName: Route['name'] | undefined): boolean =>
    !!routeName && TRADING_ENTRY_ROUTES.includes(routeName);

const resetTradingAccountKeys = (dispatch: Dispatch<UnknownAction>) => {
    dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
    dispatch(tradingBuyActions.setTradingAccountKey(undefined));
    dispatch(tradingSellActions.setTradingAccountKey(undefined));
};

export const tradingMiddleware =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        const prevState = api.getState();

        next(action);

        // get the new state after the action has been processed
        const nextState = api.getState();

        const isRouteChange = action.type === routerLocationChange.type;
        let activeSection = selectTradingActiveSection(nextState);

        if (isRouteChange) {
            const routeName = selectRouteName(nextState);
            const isTradingRoute = !!routeName?.includes('wallet-trading');
            const isBuyForm = routeName === 'wallet-trading-buy';
            const isBuy = !!routeName?.startsWith('wallet-trading-buy');
            const isSellForm = routeName === 'wallet-trading-sell';
            const isSell = !!routeName?.startsWith('wallet-trading-sell');
            const isExchangeCreationFlow = [
                'wallet-trading-exchange',
                'wallet-trading-exchange-confirm',
            ].some(name => name === routeName);
            const nextModalAccountKey = selectTradingModalAccountKey(nextState);
            const prefilledFromAccount = selectTradingPrefilledFromAccount(nextState);

            // it is necessary to clear the state because it could affect the other modal state
            if (!isTradingRoute && nextModalAccountKey) {
                api.dispatch(tradingActions.setModalAccountKey(undefined));
                api.dispatch(tradingActions.setModalCryptoCurrency(undefined));
            }

            const hasEnteredTradingSection =
                !isTradingSectionRoute(selectRouteName(prevState)) &&
                isTradingEntryRoute(routeName);

            if (hasEnteredTradingSection) {
                resetTradingAccountKeys(api.dispatch);
            }

            const stateAfterReset = api.getState();

            if (isBuyForm) {
                activeSection = 'buy';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingBuyActions.saveTransactionId(undefined));
                if (prefilledFromAccount.key) {
                    api.dispatch(tradingBuyActions.setTradingAccountKey(prefilledFromAccount.key));
                    api.dispatch(tradingBuyActions.setReceiveAccountKey(prefilledFromAccount.key));
                } else {
                    // When switching from sell tab, carry over the sell account key
                    const sellAccountKey = selectTradingAccountKeyByTradeType(
                        stateAfterReset,
                        'sell',
                    );
                    if (sellAccountKey) {
                        api.dispatch(tradingBuyActions.setTradingAccountKey(sellAccountKey));
                    }
                }
            } else if (isBuy && prefilledFromAccount.key) {
                activeSection = 'buy';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingBuyActions.setTradingAccountKey(prefilledFromAccount.key));
            }

            if (isSellForm) {
                activeSection = 'sell';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingSellActions.saveTransactionId(undefined));
                if (prefilledFromAccount.key) {
                    api.dispatch(tradingSellActions.setTradingAccountKey(prefilledFromAccount.key));
                } else {
                    // When switching from buy tab, carry over the buy account key
                    const buyAccountKey = selectTradingAccountKeyByTradeType(
                        stateAfterReset,
                        'buy',
                    );
                    if (buyAccountKey) {
                        api.dispatch(tradingSellActions.setTradingAccountKey(buyAccountKey));
                    }
                }
            } else if (isSell && prefilledFromAccount.key) {
                activeSection = 'sell';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingSellActions.setTradingAccountKey(prefilledFromAccount.key));
            }

            if (isExchangeCreationFlow) {
                activeSection = 'exchange';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingExchangeActions.saveTransactionId(undefined));
            }

            const hasLeftTradingSection =
                isTradingSectionRoute(selectRouteName(prevState)) &&
                !isTradingSectionRoute(routeName);

            if (hasLeftTradingSection) {
                resetTradingAccountKeys(api.dispatch);
                api.dispatch(
                    tradingActions.setTradingFromPrefilledAccount({
                        key: undefined,
                        cryptoId: undefined,
                    }),
                );
            }
        }

        // after an account change in the Sell or Swap update the tradeApiKey based on the account
        const isForSettingAccountKey =
            tradingExchangeActions.setTradingAccountKey.type === action.type ||
            tradingSellActions.setTradingAccountKey.type === action.type ||
            (tradingActions.bindTradingAccount.match(action) && action.payload.type !== 'buy');
        const account = selectTradingAccountAccordingActiveSection(
            nextState,
            activeSection,
            selectFullSelectedAccount(prevState),
        );

        if (isForSettingAccountKey && account) {
            tradeApi.createApiKey(account.descriptor);
        }

        return action;
    };
