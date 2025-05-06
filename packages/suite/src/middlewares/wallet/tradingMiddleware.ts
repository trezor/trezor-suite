import { MiddlewareAPI } from 'redux';

import {
    invityAPI,
    selectTradingAccountAccordingActiveSection,
    selectTradingActiveSection,
    selectTradingModalAccountKey,
    selectTradingPrefilledFromAccount,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { ROUTER } from 'src/actions/suite/constants';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { Action, AppState, Dispatch } from 'src/types/suite';

export const tradingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const state = api.getState();

        next(action);

        // get the new state after the action has been processed
        const nextState = api.getState();

        const isRouteChange = action.type === ROUTER.LOCATION_CHANGE;
        let activeSection = selectTradingActiveSection(state);

        if (isRouteChange) {
            const routeName = nextState.router.route?.name;
            const isTradingRoute = !!routeName?.includes('wallet-trading');
            const isBuy = routeName === 'wallet-trading-buy';
            const isSell = routeName === 'wallet-trading-sell';
            const isExchange = routeName === 'wallet-trading-exchange';
            const nextModalAccountKey = selectTradingModalAccountKey(nextState);
            const prefilledFromAccount = selectTradingPrefilledFromAccount(nextState);

            // it is necessary to clear the state because it could affect the other modal state
            if (!isTradingRoute && nextModalAccountKey) {
                api.dispatch(tradingActions.setModalAccountKey(undefined));
            }

            if (isBuy) {
                activeSection = 'buy';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingBuyActions.saveTransactionId(undefined));
            }

            if (isSell) {
                activeSection = 'sell';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingSellActions.saveTransactionId(undefined));
            }

            if (isExchange) {
                activeSection = 'exchange';
                api.dispatch(tradingActions.setTradingActiveSection(activeSection));
                api.dispatch(tradingExchangeActions.saveTransactionId(undefined));
            }

            const wasBuy = state.router.route?.name === 'wallet-trading-buy';
            const wasSell = state.router.route?.name === 'wallet-trading-sell';
            const isBuyToSell = wasBuy && isSell;
            const isSellToBuy = wasSell && isBuy;

            const cleanupPrefilledFromCryptoId =
                !!prefilledFromAccount.cryptoId &&
                ((!isSell && !isExchange && !isBuy) || isBuyToSell || isSellToBuy);

            if (cleanupPrefilledFromCryptoId) {
                api.dispatch(
                    tradingActions.setTradingFromPrefilledAccount({
                        descriptor: undefined,
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
