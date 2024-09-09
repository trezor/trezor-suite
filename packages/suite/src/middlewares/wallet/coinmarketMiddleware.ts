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
import { UI } from '@trezor/connect';
import { ROUTER, MODAL } from 'src/actions/suite/constants';

const coinmarketMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const state = api.getState();
        const { isLoading, lastLoadedTimestamp } = state.wallet.coinmarket;
        const { exchangeInfo } = state.wallet.coinmarket.exchange;
        const { sellInfo } = state.wallet.coinmarket.sell;
        const { router, modal } = state;

        if (action.type === COINMARKET_COMMON.LOAD_DATA) {
            const { account, status } = state.wallet.selectedAccount;
            const { platforms, coins } = state.wallet.coinmarket.info;
            const { buyInfo } = state.wallet.coinmarket.buy;

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

                const { invityServerEnvironment } = state.suite.settings.debug;
                if (invityServerEnvironment) {
                    invityAPI.setInvityServersEnvironment(invityServerEnvironment);
                }

                invityAPI.createInvityAPIKey(account.descriptor);

                const loadPromises: Promise<void>[] = [];

                if (isDifferentAccount || !platforms || !coins) {
                    loadPromises.push(
                        invityAPI.getInfo().then(info => {
                            api.dispatch(coinmarketInfoAction.saveInfo(info));
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

                Promise.all(loadPromises)
                    .then(() => api.dispatch(coinmarketCommonActions.setLoading(false, Date.now())))
                    .catch(() => api.dispatch(coinmarketCommonActions.setLoading(false)));
            }
        }

        const isCoinmarketRoute = !!router.route?.name.includes('wallet-coinmarket');
        const isDeviceContext = modal.context === MODAL.CONTEXT_DEVICE;
        const isUserContext = modal.context === MODAL.CONTEXT_USER;

        const isCloseUiWindowEvent = action.type === UI.CLOSE_UI_WINDOW;
        const isReceiveModal =
            isCloseUiWindowEvent && isDeviceContext && modal.windowType === 'ButtonRequest_Address';

        /* 
          isCloseEvent
            - happens only one time when the whole flow of sending the transaction is closed
            - isCloseUiWindowEvent can not be used, it is called multiple times during flow because of
            changing context from CONTEXT_DEVICE (sign transaction) to CONTEXT_USER (summary)
        */
        const isCloseEvent = action.type === MODAL.CLOSE;
        const isOtherFlow = isDeviceContext && modal.windowType === `ButtonRequest_Other`; // passphrase request, etc.
        const isSigningFlow = isDeviceContext && modal.windowType === 'ButtonRequest_SignTx';
        const isSummaryFlow = isUserContext && modal.payload.type === 'review-transaction';
        const isSendModal = isCloseEvent && (isOtherFlow || isSigningFlow || isSummaryFlow);

        // clear modal account on close button requests
        // it is necessary to clear the state because it could affect the next modal state
        if (isCoinmarketRoute && (isReceiveModal || isSendModal)) {
            api.dispatch(coinmarketCommonActions.setCoinmarketModalAccount(undefined));
        }

        next(action);

        // get the new state after the action has been processed
        const newState = api.getState();
        const sellCoinmarketAccount = newState.wallet.coinmarket.sell.coinmarketAccount;
        const exchangeCoinmarketAccount = newState.wallet.coinmarket.exchange.coinmarketAccount;

        if (action.type === ROUTER.LOCATION_CHANGE) {
            const isSell = newState.router.route?.name === 'wallet-coinmarket-sell';
            const isExchange = newState.router.route?.name === 'wallet-coinmarket-exchange';

            // clean coinmarketAccount in sell
            if (isSell && sellCoinmarketAccount) {
                api.dispatch(coinmarketSellActions.setCoinmarketSellAccount(undefined));
            }

            // clean coinmarketAccount in exchange
            if (isExchange && exchangeCoinmarketAccount) {
                api.dispatch(coinmarketExchangeActions.setCoinmarketExchangeAccount(undefined));
            }
        }

        return action;
    };

export default coinmarketMiddleware;
