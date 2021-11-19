import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';
import { COINMARKET_COMMON } from '@wallet-actions/constants';
import { InvityAPIReloadDataAfterMs } from '@wallet-constants/coinmarket/metadata';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';

const coinmarketMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === COINMARKET_COMMON.LOAD_DATA) {
            const { isLoading, lastLoadedTimestamp } = api.getState().wallet.coinmarket;
            const { account, status } = api.getState().wallet.selectedAccount;
            const { buyInfo } = api.getState().wallet.coinmarket.buy;
            const { exchangeCoinInfo, exchangeInfo } = api.getState().wallet.coinmarket.exchange;
            const { sellInfo } = api.getState().wallet.coinmarket.sell;

            const currentAccountDescriptor = invityAPI.getCurrentAccountDescriptor();
            const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;

            if (
                status === 'loaded' &&
                account &&
                !isLoading &&
                (isDifferentAccount ||
                    lastLoadedTimestamp + InvityAPIReloadDataAfterMs < Date.now())
            ) {
                api.dispatch(coinmarketCommonActions.setLoading(true));

                const { invityServerEnvironment } = api.getState().suite.settings.debug;
                if (invityServerEnvironment) {
                    invityAPI.setInvityServersEnvironment(invityServerEnvironment);
                }

                invityAPI.createInvityAPIKey(account.descriptor);

                const loadPromises: Promise<void>[] = [];

                if (isDifferentAccount || !buyInfo) {
                    loadPromises.push(
                        coinmarketBuyActions.loadBuyInfo().then(buyInfo => {
                            api.dispatch(coinmarketBuyActions.saveBuyInfo(buyInfo));
                        }),
                    );
                }

                if (isDifferentAccount || !exchangeInfo || !exchangeCoinInfo) {
                    loadPromises.push(
                        coinmarketExchangeActions
                            .loadExchangeInfo()
                            .then(([exchangeInfo, exchangeCoinInfo]) => {
                                api.dispatch(
                                    coinmarketExchangeActions.saveExchangeInfo(exchangeInfo),
                                );
                                api.dispatch(
                                    coinmarketExchangeActions.saveExchangeCoinInfo(
                                        exchangeCoinInfo,
                                    ),
                                );
                            }),
                    );
                }

                if (isDifferentAccount || !sellInfo) {
                    loadPromises.push(
                        coinmarketSellActions.loadSellInfo().then(sellInfo => {
                            api.dispatch(coinmarketSellActions.saveSellInfo(sellInfo));
                        }),
                    );
                }

                Promise.all(loadPromises)
                    .then(() => api.dispatch(coinmarketCommonActions.setLoading(false, Date.now())))
                    .catch(() => api.dispatch(coinmarketCommonActions.setLoading(false)));
            }
        }

        next(action);

        return action;
    };

export default coinmarketMiddleware;
