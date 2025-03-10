import { createContext, useContext, useEffect } from 'react';

import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingType,
    selectTrading,
    tradingThunks,
} from '@suite-common/trading';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import {
    TradingGetDetailDataProps,
    TradingGetTypedInfoTradeProps,
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

const getTypedInfoTrade = <T extends keyof TradingTradeMapProps>({
    trading,
    tradeType,
}: TradingGetTypedInfoTradeProps): TradingTradeInfoMapProps[T] => {
    switch (tradeType) {
        case 'sell': {
            const { sellInfo } = trading.sell;

            return sellInfo as TradingTradeInfoMapProps[T];
        }
        default: {
            const { exchangeInfo } = trading.exchange;

            return exchangeInfo as TradingTradeInfoMapProps[T];
        }
    }
};

const getTradingDetailData = <T extends TradingType>({
    trading,
    tradingNew,
    tradeType,
}: TradingGetDetailDataProps): TradingGetDetailDataOutputProps<T> => {
    const { trades } = trading;

    // TODO: trading - temporary hack solution using new reducer state
    if (tradeType === 'buy') {
        const { trades } = tradingNew;
        const { buyInfo, transactionId } = tradingNew.buy;

        const trade = getTypedTrade<T>({
            trades,
            tradeType,
            transactionId,
        });

        return {
            transactionId,
            info: buyInfo as TradingTradeInfoMapProps[T],
            trade,
        };
    }

    const { transactionId } = trading[tradeType];
    const trade = getTypedTrade<T>({
        trades,
        tradeType,
        transactionId,
    });
    const info = getTypedInfoTrade<T>({
        trading,
        tradeType,
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
    const { info, transactionId, trade } = getTradingDetailData<T>({
        trading,
        tradingNew,
        tradeType,
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
