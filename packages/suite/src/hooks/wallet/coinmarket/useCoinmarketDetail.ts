import { useSelector } from 'src/hooks/suite';
import { createContext, useContext } from 'react';
import {
    CoinmarketDetailContextValues,
    CoinmarketGetDetailDataOutputProps,
    CoinmarketUseDetailOutputProps,
    CoinmarketUseDetailProps,
} from 'src/types/coinmarket/coinmarketDetail';
import { useCoinmarketWatchTrade } from './useCoinmarketWatchTrade';
import { Trade, TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';
import {
    CoinmarketGetDetailDataProps,
    CoinmarketGetTypedInfoTradeProps,
    CoinmarketGetTypedTradeProps,
    CoinmarketTradeInfoMapProps,
    CoinmarketTradeMapProps,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { useServerEnvironment } from './useServerEnviroment';

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
        case 'sell': {
            const { sellInfo } = coinmarket.sell;

            return sellInfo as CoinmarketTradeInfoMapProps[T];
        }
        case 'exchange': {
            const { exchangeInfo } = coinmarket.exchange;

            return exchangeInfo as CoinmarketTradeInfoMapProps[T];
        }
        default: {
            const { buyInfo } = coinmarket.buy;

            return buyInfo as CoinmarketTradeInfoMapProps[T];
        }
    }
};

const getCoinmarketDetailData = <T extends CoinmarketTradeType>({
    coinmarket,
    tradeType,
}: CoinmarketGetDetailDataProps): CoinmarketGetDetailDataOutputProps<T> => {
    // will not be further used
    if (tradeType === 'savings' || tradeType === 'spend') return {};

    const { trades } = coinmarket;
    const { transactionId } = coinmarket[tradeType];
    const trade = getTypedTrade<T>({
        trades,
        tradeType,
        transactionId,
    });
    const info = getTypedInfoTrade<T>({
        coinmarket,
        tradeType,
    });

    return {
        transactionId,
        info,
        trade,
    };
};

export const useCoinmarketDetail = <T extends CoinmarketTradeType>({
    selectedAccount,
    tradeType,
}: CoinmarketUseDetailProps): CoinmarketUseDetailOutputProps<T> => {
    const coinmarket = useSelector(state => state.wallet.coinmarket);
    const { account } = selectedAccount;
    const { info, transactionId, trade } = getCoinmarketDetailData<T>({
        coinmarket,
        tradeType,
    });

    useServerEnvironment();
    useCoinmarketWatchTrade({ account, trade });

    return {
        account,
        trade,
        transactionId,
        info,
    };
};

export const CoinmarketDetailContext = createContext<CoinmarketDetailContextValues<any> | null>(
    null,
);
CoinmarketDetailContext.displayName = 'CoinmarketDetailContext';

export const useCoinmarketDetailContext = <T extends CoinmarketTradeType>() => {
    const context = useContext<CoinmarketDetailContextValues<T> | null>(CoinmarketDetailContext);
    if (context === null) throw Error('CoinmarketDetailContext used without Context');

    return context;
};
