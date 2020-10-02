import { createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyDetail';
import { useWatchBuyTrade } from '@wallet-hooks/useCoinmarket';
import { useSelector } from 'react-redux';
import { AppState } from '@suite-types';
import invityAPI from '@suite-services/invityAPI';

export const useCoinmarketBuyDetail = (props: Props) => {
    const { selectedAccount, trades, transactionId } = props;
    const { account } = selectedAccount;
    const invityAPIUrl = useSelector<
        AppState,
        AppState['suite']['settings']['debug']['invityAPIUrl']
    >(state => state.suite.settings.debug.invityAPIUrl);
    if (invityAPIUrl) {
        invityAPI.setInvityAPIServer(invityAPIUrl);
    }
    const buyInfo = useSelector<AppState, AppState['wallet']['coinmarket']['buy']['buyInfo']>(
        state => state.wallet.coinmarket.buy.buyInfo,
    );

    const [updatedTrade] = useWatchBuyTrade(account, trades, transactionId);

    return {
        account,
        trade: updatedTrade,
        transactionId,
        buyInfo,
    };
};

export const CoinmarketBuyDetailContext = createContext<ContextValues | null>(null);
CoinmarketBuyDetailContext.displayName = 'CoinmarketBuyDetailContext';

export const useCoinmarketBuyDetailContext = () => {
    const context = useContext(CoinmarketBuyDetailContext);
    if (context === null) throw Error('CoinmarketBuyDetailContext used without Context');
    return context;
};
