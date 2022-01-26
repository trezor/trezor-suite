import type { MiddlewareAPI } from 'redux';
import type { AppState, Action, Dispatch } from '@suite-types';
import { COINMARKET_COMMON } from '@wallet-actions/constants';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import type { InvityAuthentication, AccountInfo } from '@wallet-types/invity';
import * as routerActions from '@suite-actions/routerActions';

const invityAuthenticationMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === COINMARKET_COMMON.LOAD_INVITY_AUTHENTICATION) {
            const { isInvityAuthenticationLoading } = api.getState().wallet.coinmarket;
            const { invityServerEnvironment } = api.getState().suite.settings.debug;
            const { account, status } = api.getState().wallet.selectedAccount;

            if (!isInvityAuthenticationLoading && status === 'loaded' && account) {
                api.dispatch(coinmarketCommonActions.setInvityAuthenticationLoading(true));

                if (invityServerEnvironment) {
                    invityAPI.setInvityServersEnvironment(invityServerEnvironment);
                }

                invityAPI.createInvityAPIKey(account.descriptor);

                fetch(invityAPI.getCheckInvityAuthenticationUrl(), {
                    credentials: 'include',
                })
                    .then(response => response.json())
                    .then((invityAuthentication: InvityAuthentication) => {
                        if (invityAuthentication.error) {
                            invityAuthentication.active = false;
                        }
                        if (invityAuthentication.identity && invityAuthentication.active) {
                            invityAuthentication.verified =
                                invityAuthentication.identity.verifiable_addresses[0].verified;
                        } else {
                            invityAuthentication.verified = false;
                        }
                        // TODO: get rid off setProtectedAPI -> invityAPI.accountInfo should call itself the right endpoint with right parameters in within fetch(...)
                        // TODO: setProtectedAPI - this is an antipattern, because it mutates state of the InvityAPI instance while it can be used from somewhere else (calling /api/exchange/...).
                        invityAPI.setProtectedAPI(invityAuthentication.verified || false);
                        if (invityAuthentication.verified) {
                            invityAuthentication.email =
                                invityAuthentication.identity?.traits.email;
                            return invityAPI
                                .accountInfo()
                                .then(response => {
                                    if (response.data) {
                                        const accountInfo: AccountInfo = response.data;
                                        invityAPI.setProtectedAPI(false);
                                        invityAuthentication = {
                                            ...invityAuthentication,
                                            accountInfo,
                                        };
                                    } else {
                                        invityAuthentication = {
                                            ...invityAuthentication,
                                            error: {
                                                code: 503,
                                                status: 'Error',
                                                reason: response.error || '',
                                            },
                                        };
                                    }
                                    return invityAuthentication;
                                })
                                .catch(error => {
                                    const reason = error instanceof Object ? error.toString() : '';
                                    invityAuthentication = {
                                        ...invityAuthentication,
                                        error: { code: 503, status: 'Error', reason },
                                    };
                                    return invityAuthentication;
                                });
                        }
                        if (action.redirectUnauthorizedUserToLogin) {
                            api.dispatch(
                                routerActions.goto('wallet-invity-login', {
                                    symbol: account.symbol,
                                    accountIndex: account.index,
                                    accountType: account.accountType,
                                }),
                            );
                        }
                    })
                    .then(invityAuthentication => {
                        if (invityAuthentication) {
                            api.dispatch(
                                coinmarketCommonActions.saveInvityAuthentication(
                                    invityAuthentication,
                                ),
                            );
                            api.dispatch(coinmarketSavingsActions.loadSavingsTrade);
                        }
                    })
                    .catch(error => {
                        const reason = error instanceof Object ? error.toString() : '';
                        api.dispatch(
                            coinmarketCommonActions.saveInvityAuthentication({
                                error: { code: 503, status: 'Error', reason },
                            }),
                        );
                    })
                    .finally(() => {
                        invityAPI.setProtectedAPI(false);
                        api.dispatch(coinmarketCommonActions.setInvityAuthenticationLoading(false));
                    });
            }
        }

        next(action);

        return action;
    };

export default invityAuthenticationMiddleware;
