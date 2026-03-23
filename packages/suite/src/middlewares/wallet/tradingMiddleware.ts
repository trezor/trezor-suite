import { type MiddlewareAPI } from 'redux';

import { routerLocationChange } from '@suite/router';
import {
    invityAPI,
    selectTradingAccountAccordingActiveSection,
    selectTradingAccountKeyByTradeType,
    selectTradingActiveSection,
    selectTradingModalAccountKey,
    selectTradingPrefilledFromAccount,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { type Action, type AppState, type Dispatch } from 'src/types/suite';

export const tradingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const state = api.getState();

        next(action);

        // get the new state after the action has been processed
        const nextState = api.getState();

        const isRouteChange = action.type === routerLocationChange.type;
        let activeSection = selectTradingActiveSection(state);

        if (isRouteChange) {
            const routeName = nextState.router.route?.name;
            const isTradingRoute = !!routeName?.includes('wallet-trading');
            const isBuyForm = routeName === 'wallet-trading-buy';
            const isBuy = !!routeName?.startsWith('wallet-trading-buy');
            const isSellForm = routeName === 'wallet-trading-sell';
            const isSell = !!routeName?.startsWith('wallet-trading-sell');
            const isExchangeCreationFlow = [
                'wallet-trading-exchange',
                'wallet-trading-exchange-confirm',
                'wallet-trading-exchange-offers',
            ].some(name => name === routeName);
            const isExchangeTransactionDetail = routeName === 'wallet-trading-exchange-detail';
            const nextModalAccountKey = selectTradingModalAccountKey(nextState);
            const prefilledFromAccount = selectTradingPrefilledFromAccount(nextState);

            // it is necessary to clear the state because it could affect the other modal state
            if (!isTradingRoute && nextModalAccountKey) {
                api.dispatch(tradingActions.setModalAccountKey(undefined));
                api.dispatch(tradingActions.setModalCryptoCurrency(undefined));
            }

            if (isBuyForm) {
                activeSection = 'buy';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingBuyActions.saveTransactionId(undefined));
                if (prefilledFromAccount.key) {
                    api.dispatch(tradingBuyActions.setTradingAccountKey(prefilledFromAccount.key));
                } else {
                    // When switching from sell tab, carry over the sell account key
                    const sellAccountKey = selectTradingAccountKeyByTradeType(nextState, 'sell');
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
                    const buyAccountKey = selectTradingAccountKeyByTradeType(nextState, 'buy');
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

            const isInTradingSection =
                isBuy || isSell || isExchangeCreationFlow || isExchangeTransactionDetail;

            if (!isInTradingSection) {
                api.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
                api.dispatch(tradingBuyActions.setTradingAccountKey(undefined));
                api.dispatch(tradingSellActions.setTradingAccountKey(undefined));
                api.dispatch(
                    tradingActions.setTradingFromPrefilledAccount({
                        key: undefined,
                        cryptoId: undefined,
                    }),
                );
            }
        }

        // after an account change in the Sell or Swap update the invityAPIKey based on the account
        const isForSettingAccountKey =
            tradingExchangeActions.setTradingAccountKey.type === action.type ||
            tradingSellActions.setTradingAccountKey.type === action.type;
        const account = selectTradingAccountAccordingActiveSection(
            nextState,
            activeSection,
            selectFullSelectedAccount(state),
        );

        if (isForSettingAccountKey && account) {
            invityAPI.createInvityAPIKey(account.descriptor);
        }

        return action;
    };
