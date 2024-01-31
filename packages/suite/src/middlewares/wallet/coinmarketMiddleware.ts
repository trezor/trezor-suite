import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { COINMARKET_COMMON } from 'src/actions/wallet/constants';
import { InvityAPIReloadDataAfterMs } from 'src/constants/wallet/coinmarket/metadata';
import invityAPI from 'src/services/suite/invityAPI';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketInfoAction from 'src/actions/wallet/coinmarketInfoActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as coinmarketExchangeActions from 'src/actions/wallet/coinmarketExchangeActions';
import * as coinmarketSellActions from 'src/actions/wallet/coinmarketSellActions';
import * as coinmarketP2pActions from 'src/actions/wallet/coinmarketP2pActions';
import * as coinmarketSavingsActions from 'src/actions/wallet/coinmarketSavingsActions';

const coinmarketMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === COINMARKET_COMMON.LOAD_DATA) {
            const { isLoading, lastLoadedTimestamp } = api.getState().wallet.coinmarket;
            const { account, status } = api.getState().wallet.selectedAccount;
            const { symbolsInfo } = api.getState().wallet.coinmarket.info;
            const { buyInfo } = api.getState().wallet.coinmarket.buy;
            const { exchangeInfo } = api.getState().wallet.coinmarket.exchange;
            const { sellInfo } = api.getState().wallet.coinmarket.sell;
            const { p2pInfo } = api.getState().wallet.coinmarket.p2p;
            const { savingsInfo } = api.getState().wallet.coinmarket.savings;

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

                if (isDifferentAccount || !symbolsInfo || symbolsInfo.length === 0) {
                    loadPromises.push(
                        coinmarketInfoAction.loadSymbolsInfo().then(symbolsInfo => {
                            api.dispatch(coinmarketInfoAction.saveSymbolsInfo(symbolsInfo));
                        }),
                    );
                }

                if (isDifferentAccount || !buyInfo) {
                    loadPromises.push(
                        coinmarketBuyActions.loadBuyInfo().then(buyInfo => {
                            api.dispatch(coinmarketBuyActions.saveBuyInfo(buyInfo));
                        }),
                    );
                }

                if (isDifferentAccount || !exchangeInfo) {
                    loadPromises.push(
                        coinmarketExchangeActions.loadExchangeInfo().then(exchangeInfo => {
                            api.dispatch(coinmarketExchangeActions.saveExchangeInfo(exchangeInfo));
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

                if (isDifferentAccount || !p2pInfo) {
                    loadPromises.push(
                        coinmarketP2pActions.loadP2pInfo().then(p2pInfo => {
                            api.dispatch(coinmarketP2pActions.saveP2pInfo(p2pInfo));
                        }),
                    );
                }

                if (isDifferentAccount || !savingsInfo) {
                    loadPromises.push(
                        coinmarketSavingsActions.loadSavingsInfo().then(savingsInfo => {
                            api.dispatch(coinmarketSavingsActions.saveSavingsInfo(savingsInfo));
                            api.dispatch(coinmarketSavingsActions.loadSavingsTrade());
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
