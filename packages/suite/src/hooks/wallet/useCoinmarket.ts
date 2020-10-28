import { useEffect, useState } from 'react';
import { BuyTradeStatus } from 'invity-api';
import useUnmount from 'react-use/lib/useUnmount';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { useSelector, useActions } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import { Account } from '@wallet-types';
import { TradeBuy } from '@wallet-reducers/coinmarketReducer';

export const useInvityAPI = () => {
    const { selectedAccount, buyInfo, exchangeInfo, invityAPIUrl } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        buyInfo: state.wallet.coinmarket.buy.buyInfo,
        exchangeInfo: state.wallet.coinmarket.exchange.exchangeInfo,
        invityAPIUrl: state.suite.settings.debug.invityAPIUrl,
    }));

    const { saveBuyInfo, saveExchangeInfo } = useActions({
        saveBuyInfo: coinmarketBuyActions.saveBuyInfo,
        saveExchangeInfo: coinmarketExchangeActions.saveExchangeInfo,
    });

    if (selectedAccount.status === 'loaded') {
        if (invityAPIUrl) {
            invityAPI.setInvityAPIServer(invityAPIUrl);
        }

        invityAPI.createInvityAPIKey(selectedAccount.account?.descriptor);

        if (!buyInfo?.buyInfo) {
            coinmarketBuyActions.loadBuyInfo().then(buyInfo => {
                saveBuyInfo(buyInfo);
            });
        }

        if (!exchangeInfo) {
            coinmarketExchangeActions.loadExchangeInfo().then(exchangeInfo => {
                saveExchangeInfo(exchangeInfo);
            });
        }
    }

    return {
        buyInfo,
        exchangeInfo,
    };
};

const BuyTradeFinalStatuses: BuyTradeStatus[] = ['SUCCESS', 'ERROR', 'BLOCKED'];

const shouldRefresh = (trade?: TradeBuy) => {
    return trade && trade.data.status && !BuyTradeFinalStatuses.includes(trade.data.status);
};

export const useWatchBuyTrade = (account: Account, trade: TradeBuy) => {
    const REFRESH_SECONDS = 30;
    const { saveTrade } = useActions({ saveTrade: coinmarketBuyActions.saveTrade });
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefresh(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    useEffect(() => {
        if (trade && shouldRefresh(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            invityAPI.watchBuyTrade(trade.data, refreshCount).then(response => {
                if (response.status && response.status !== trade.data.status) {
                    const newDate = new Date().toISOString();
                    const tradeData = {
                        ...trade.data,
                        status: response.status,
                        error: response.error,
                    };
                    saveTrade(tradeData, account, newDate);
                }
            });
            resetRefresh();
        }
    }, [account, cancelRefresh, refreshCount, resetRefresh, saveTrade, trade]);
};
