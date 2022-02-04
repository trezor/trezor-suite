import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch, Route } from '@suite-types';
import { COINMARKET_SAVINGS } from '@wallet-actions/constants';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import * as routerActions from '@suite-actions/routerActions';
import type { Account } from '@wallet-types';
import { loadSavingsTrade } from '@wallet-actions/coinmarketSavingsActions';

const navigateToRouteName = (routeName: Route['name'], account: Account) =>
    routerActions.goto(routeName, {
        params: {
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        },
    });

// TODO: still work in progress
const coinmarketSavingsMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === COINMARKET_SAVINGS.SET_USER_COUNTRY_EFFECTIVE) {
            const { account, status } = api.getState().wallet.selectedAccount;
            if (status === 'loaded' && account) {
                api.dispatch(navigateToRouteName('wallet-coinmarket-savings', account));
                next(action);
                return action;
            }
        }

        if (action.type === COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE) {
            const { account, status } = api.getState().wallet.selectedAccount;
            const { selectedProvider, countryEffective } = api.getState().wallet.coinmarket.savings;
            if (status === 'loaded' && account && selectedProvider) {
                if (selectedProvider.isClientFromUnsupportedCountry && !countryEffective) {
                    api.dispatch(
                        navigateToRouteName(
                            'wallet-coinmarket-savings-unsupported-country',
                            account,
                        ),
                    );
                    next(action);
                    return action;
                }

                const { invityAuthentication } = api.getState().wallet.coinmarket;

                if (!invityAuthentication) {
                    api.dispatch(navigateToRouteName('wallet-coinmarket-savings', account));
                    next(action);
                    return action;
                }
                const userInfoRequired =
                    !!invityAuthentication.accountInfo?.settings &&
                    (!invityAuthentication.accountInfo.settings.givenName ||
                        !invityAuthentication.accountInfo.settings.familyName ||
                        !invityAuthentication.accountInfo.settings.phoneNumber);
                if (userInfoRequired) {
                    api.dispatch(navigateToRouteName('wallet-invity-user-info', account));
                    next(action);
                    return action;
                }

                const phoneNumberVerificationRequired =
                    !!invityAuthentication.accountInfo &&
                    !invityAuthentication.accountInfo.settings?.phoneNumberVerified;
                if (phoneNumberVerificationRequired) {
                    api.dispatch(
                        navigateToRouteName('wallet-invity-phone-number-verification', account),
                    );
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
                                if (response.trade.kycStatus === 'InProgress') {
                                    api.dispatch(
                                        coinmarketSavingsActions.startWatchingKYCStatus(
                                            response.trade.exchange,
                                        ),
                                    );
                                }
                                if (response.trade.kycStatus === 'Open') {
                                    api.dispatch(
                                        navigateToRouteName('wallet-invity-kyc-start', account),
                                    );
                                    next(action);
                                    return action;
                                }
                                if (response.trade.kycStatus === 'Failed') {
                                    api.dispatch(
                                        navigateToRouteName('wallet-invity-kyc-failed', account),
                                    );
                                    next(action);
                                    return action;
                                }
                                if (
                                    response.trade.status === 'AML' &&
                                    response.trade.amlStatus === 'Open'
                                ) {
                                    api.dispatch(navigateToRouteName('wallet-invity-aml', account));
                                    next(action);
                                    return action;
                                }
                                if (response.trade.status === 'SetSavingsParameters') {
                                    api.dispatch(
                                        navigateToRouteName(
                                            'wallet-coinmarket-savings-setup',
                                            account,
                                        ),
                                    );
                                    next(action);
                                    return action;
                                }

                                if (response.trade.status === 'ConfirmPaymentInfo') {
                                    api.dispatch(
                                        navigateToRouteName(
                                            'wallet-coinmarket-savings-payment-info',
                                            account,
                                        ),
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
                                    api.dispatch(
                                        navigateToRouteName('wallet-invity-kyc-start', account),
                                    );
                                    next(action);
                                    return action;
                                }
                            }
                        })
                        .catch(error => {
                            console.error(error);
                        })
                        .finally(() => {
                            api.dispatch(
                                coinmarketSavingsActions.setSavingsTradeResponseLoading(false),
                            );
                        });
                }
            }
        }

        if (action.type === COINMARKET_SAVINGS.START_WATCHING_KYC_STATUS) {
            const { account, status } = api.getState().wallet.selectedAccount;
            if (account && status === 'loaded') {
                // TODO: Extract
                const timeoutMs = 10_000;
                const intervalMs = 5_000;
                const maxAttempts = 60;

                let counter = 0;
                let intervalId = 0;
                const startWatchingKYCStatus = () => {
                    if (counter === maxAttempts) {
                        clearInterval(intervalId);
                        return;
                    }
                    counter += 1;
                    // TODO: Involve AbortController in timeout
                    const request = invityAPI.watchKYCStatus(action.exchange);
                    let timeoutId: number;
                    const timeout = new Promise<'timeout'>(resolve => {
                        clearTimeout(timeoutId);
                        timeoutId = window.setTimeout(() => {
                            resolve('timeout');
                        }, timeoutMs);
                        api.dispatch(
                            coinmarketSavingsActions.setWatchingKYCStatusMetadata(
                                intervalId,
                                timeoutId,
                            ),
                        );
                    });

                    Promise.race([request, timeout]).then(result => {
                        if (result === 'timeout') {
                            startWatchingKYCStatus();
                            return;
                        }
                        if (
                            result &&
                            result.status === 'Success' &&
                            ['Failed', 'Verified'].includes(result.kycStatus)
                        ) {
                            if (result.kycStatus === 'Failed') {
                                api.dispatch(
                                    navigateToRouteName('wallet-invity-kyc-failed', account),
                                );
                            } else {
                                // Verified
                                const exchange =
                                    api.getState().wallet.coinmarket.savings.savingsTrade?.exchange;
                                if (exchange) {
                                    api.dispatch(loadSavingsTrade(exchange));
                                }
                            }

                            api.dispatch(
                                coinmarketSavingsActions.stopWatchingKYCStatus(result.kycStatus),
                            );
                        }
                    });
                };
                intervalId = window.setInterval(() => {
                    startWatchingKYCStatus();
                }, intervalMs);
            }
        }

        if (action.type === COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS) {
            const { intervalId, timeoutId } =
                api.getState().wallet.coinmarket.savings.watchingKYCMetadata;
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }

        next(action);
        return action;
    };
export default coinmarketSavingsMiddleware;
