import { useSelector } from 'react-redux';
import { useActions } from '@suite-hooks';
import { AppState } from '@suite-types';
import { loadBuyInfo } from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import invityAPI from '@suite-services/invityAPI';
import { loadExchangeInfo } from '@suite/actions/wallet/coinmarketExchangeActions';

export const useInvityAPI = () => {
    const selectedAccount = useSelector<AppState, AppState['wallet']['selectedAccount']>(
        state => state.wallet.selectedAccount,
    );

    const buyInfo = useSelector<AppState, AppState['wallet']['coinmarket']['buy']['buyInfo']>(
        state => state.wallet.coinmarket.buy.buyInfo,
    );

    const exchangeInfo = useSelector<
        AppState,
        AppState['wallet']['coinmarket']['exchange']['exchangeInfo']
    >(state => state.wallet.coinmarket.exchange.exchangeInfo);

    const { saveBuyInfo } = useActions({ saveBuyInfo: coinmarketBuyActions.saveBuyInfo });
    const { saveExchangeInfo } = useActions({
        saveExchangeInfo: coinmarketExchangeActions.saveExchangeInfo,
    });

    if (selectedAccount.status === 'loaded') {
        invityAPI.createInvityAPIKey(selectedAccount.account?.descriptor);

        if (!buyInfo?.buyInfo) {
            loadBuyInfo().then(buyInfo => {
                saveBuyInfo(buyInfo);
            });
        }

        if (!exchangeInfo) {
            loadExchangeInfo().then(exchangeInfo => {
                saveExchangeInfo(exchangeInfo);
            });
        }
    }

    return {
        buyInfo,
        exchangeInfo,
    };
};
