import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch, Route } from '@suite-types';
import { COINMARKET_SAVINGS } from '@wallet-actions/constants';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import * as routerActions from '@suite-actions/routerActions';

// TODO: still work in progress
const coinmarketSavingsMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE) {
            const { account, status } = api.getState().wallet.selectedAccount;
            if (status === 'loaded' && account) {
                const navigateToRouteName = (routeName: Route['name']) =>
                    routerActions.goto(routeName, {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    });

                const { invityAuthentication } = api.getState().wallet.coinmarket;

                if (!invityAuthentication) {
                    api.dispatch(navigateToRouteName('wallet-coinmarket-savings'));
                    next(action);
                    return action;
                }

                const userInfoRequired =
                    !!invityAuthentication.accountInfo?.settings &&
                    (!invityAuthentication.accountInfo.settings.givenName ||
                        !invityAuthentication.accountInfo.settings.familyName ||
                        !invityAuthentication.accountInfo.settings.phoneNumber);
                if (userInfoRequired) {
                    api.dispatch(navigateToRouteName('wallet-invity-user-info'));
                    next(action);
                    return action;
                }

                const phoneNumberVerificationRequired =
                    !!invityAuthentication.accountInfo &&
                    !invityAuthentication.accountInfo.settings?.phoneNumberVerified;
                if (phoneNumberVerificationRequired) {
                    api.dispatch(navigateToRouteName('wallet-invity-phone-number-verification'));
                    next(action);
                    return action;
                }

                const phoneNumberVerified =
                    !phoneNumberVerificationRequired &&
                    !!invityAuthentication.accountInfo &&
                    !!invityAuthentication.accountInfo.settings?.phoneNumberVerified;
                if (phoneNumberVerified) {
                    api.dispatch(coinmarketSavingsActions.setSavingsTradeResponseLoading(true));
                    invityAPI
                        .getSavingsTrade(action.exchangeName)
                        .then(response => {
                            if (
                                response?.trade &&
                                (!response.trade.errors || response.trade.errors.length === 0)
                            ) {
                                api.dispatch(
                                    coinmarketSavingsActions.saveSavingsTradeResponse(response),
                                );
                                if (response.trade.status === 'KYC') {
                                    if (response.trade.kycStatus === 'Open') {
                                        api.dispatch(
                                            navigateToRouteName('wallet-invity-kyc-start'),
                                        );
                                        next(action);
                                        return action;
                                    }
                                    if (response.trade.kycStatus === 'Failed') {
                                        // TODO: KYC failed page
                                        // api.dispatch(navigateToRouteName('wallet-invity-kyc-failed'));
                                        next(action);
                                        return action;
                                    }
                                }
                                if (
                                    response.trade.status === 'AML' &&
                                    response.trade.amlStatus === 'Open'
                                ) {
                                    api.dispatch(navigateToRouteName('wallet-invity-aml'));
                                    next(action);
                                    return action;
                                }
                                if (response.trade.status === 'SetSavingsParameters') {
                                    api.dispatch(
                                        navigateToRouteName('wallet-coinmarket-savings-setup'),
                                    );
                                    next(action);
                                    return action;
                                }

                                next(action);
                                return action;
                            }
                            if (response?.trade?.errors && response.trade.errors.length > 0) {
                                // TODO: Fix error message resp. codes
                                if (response.trade.errors[0] === 'Savings transaction not found.') {
                                    api.dispatch(navigateToRouteName('wallet-invity-kyc-start'));
                                    next(action);
                                    return action;
                                }
                            }
                        })
                        .finally(() => {
                            api.dispatch(
                                coinmarketSavingsActions.setSavingsTradeResponseLoading(false),
                            );
                        });
                }
            }
        }

        next(action);
        return action;
    };
export default coinmarketSavingsMiddleware;
