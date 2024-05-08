import { useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { createContext, useContext } from 'react';
import {
    CoinmarketDetailContextValues,
    GetCoinmarketDetailDataProps,
    UseCoinmarketDetailProps,
} from 'src/types/coinmarket/coinmarketDetail';
import { useCoinmarketWatchTrade } from './useCoinmarketWatchTrade';
import { Trade, TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';

const isBuyTrade = (trade: Trade): trade is TradeBuy => trade.tradeType === 'buy';

const getTypedTrade = <T extends CoinmarketTradeType>({
    trades,
    tradeType,
    transactionId,
}: CoinmarketGetTypedTradeProps): CoinmarketTradeMapProps[T] | undefined => {
    const trade = trades.find(
        trade =>
            trade.tradeType === tradeType &&
            (trade.key == transactionId ||
                (isBuyTrade(trade) && trade.data?.originalPaymentId === transactionId)),
    );

    if (!trade) {
        return undefined;
    }

    return trade as CoinmarketTradeMapProps[T];
};

const getTypedInfoTrade = <T extends keyof CoinmarketTradeMapProps>({
    coinmarket,
    tradeType,
}: CoinmarketGetTypedInfoTradeProps): CoinmarketTradeInfoMapProps[T] => {
    switch (tradeType) {
        case 'buy':
            return {
                transactionId: coinmarket.buy.transactionId,
                info: coinmarket.buy.buyInfo,
            };
        case 'sell':
            return {
                transactionId: coinmarket.sell.transactionId,
                info: coinmarket.sell.sellInfo,
            };
        case 'exchange':
            return {
                transactionId: coinmarket.exchange.transactionId,
                info: coinmarket.exchange.exchangeInfo,
            };
        default:
            return {};
    }
};

const useServerEnvironment = () => {
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }
};

export const useCoinmarketDetail = ({ selectedAccount, tradeType }: UseCoinmarketDetailProps) => {
    const coinmarket = useSelector(state => state.wallet.coinmarket);
    const { trades } = coinmarket;
    const { account } = selectedAccount;
    const { info, transactionId } = getCoinmarketDetailData({ coinmarket, tradeType });
    const trade = trades.find(
        trade => trade.tradeType === tradeType && trade.key === transactionId,
    );

    useServerEnvironment();
    useCoinmarketWatchTrade({ account, trade });

    return {
        account,
        trade,
        transactionId,
        info,
    };
};

export const CoinmarketDetailContext = createContext<CoinmarketDetailContextValues | null>(null);
CoinmarketDetailContext.displayName = 'CoinmarketDetailContext';

export const useCoinmarketDetailContext = () => {
    const context = useContext(CoinmarketDetailContext);
    if (context === null) throw Error('CoinmarketDetailContext used without Context');

    return context;
};
