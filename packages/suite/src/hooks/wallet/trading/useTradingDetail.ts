import { createContext, useContext, useEffect } from 'react';

import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingType,
    selectTrading,
    selectTradingBuyInfo,
    tradingThunks,
} from '@suite-common/trading';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import {
    selectTradingExchangeInfo,
    selectTradingSellInfo,
} from 'src/reducers/wallet/tradingReducer';
import {
    TradingGetDetailDataProps,
    TradingGetTypedTradeProps,
    TradingTradeInfoMapProps,
    TradingTradeMapProps,
} from 'src/types/trading/trading';
import {
    TradingDetailContextValues,
    TradingGetDetailDataOutputProps,
    TradingUseDetailOutputProps,
    TradingUseDetailProps,
} from 'src/types/trading/tradingDetail';

const isBuyTrade = (trade: TradingTransaction): trade is TradingTransactionBuy =>
    trade.tradeType === 'buy';

const getTypedTrade = <T extends TradingType>({
    trades,
    tradeType,
    transactionId,
}: TradingGetTypedTradeProps): TradingTradeMapProps[T] | undefined => {
    const trade = trades.find(
        trade =>
            trade.tradeType === tradeType &&
            (trade.key == transactionId ||
                (isBuyTrade(trade) && trade.data?.originalPaymentId === transactionId)),
    );

    if (!trade) {
        return undefined;
    }

    return trade as TradingTradeMapProps[T];
};

const getTradingDetailData = <T extends TradingType>({
    trading,
    tradingNew,
    tradeType,
    infos,
}: TradingGetDetailDataProps): TradingGetDetailDataOutputProps<T> => {
    const { trades } = trading;
    const info = infos[tradeType] as TradingTradeInfoMapProps[T];

    // TODO: trading - temporary hack solution using new reducer state
    if (tradeType === 'buy') {
        const { trades } = tradingNew;
        const { transactionId } = tradingNew.buy;

        const trade = getTypedTrade<T>({
            trades,
            tradeType,
            transactionId,
        });

        return {
            transactionId,
            info,
            trade,
        };
    }

    const { transactionId } = trading[tradeType];
    const trade = getTypedTrade<T>({
        trades,
        tradeType,
        transactionId,
    });

    return {
        transactionId,
        info,
        trade,
    };
};

export const useTradingDetail = <T extends TradingType>({
    selectedAccount,
    tradeType,
}: TradingUseDetailProps): TradingUseDetailOutputProps<T> => {
    const trading = useSelector(state => state.wallet.trading);
    const tradingNew = useSelector(selectTrading);
    const { account } = selectedAccount;
    const buyInfo = useSelector(selectTradingBuyInfo);
    const sellInfo = useSelector(selectTradingSellInfo);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const { info, transactionId, trade } = getTradingDetailData<T>({
        trading,
        tradingNew,
        tradeType,
        infos: {
            buy: buyInfo,
            sell: sellInfo,
            exchange: exchangeInfo,
        },
    });
    const dispatch = useDispatch();

    // TODO: trading - is it possible to have buyInfo before render?
    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: tradeType }));
    }, [dispatch, tradeType]);
    useTradingLoadData();
    useServerEnvironment();
    useTradingWatchTrade({ account, trade });

    return {
        account,
        trade,
        transactionId,
        info,
    };
};

export const TradingDetailContext = createContext<TradingDetailContextValues<any> | null>(null);
TradingDetailContext.displayName = 'TradingDetailContext';

export const useTradingDetailContext = <T extends TradingType>() => {
    const context = useContext<TradingDetailContextValues<T> | null>(TradingDetailContext);
    if (context === null) throw Error('TradingDetailContext used without Context');

    return context;
};
