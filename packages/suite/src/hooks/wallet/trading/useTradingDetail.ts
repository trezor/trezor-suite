import { createContext, useContext } from 'react';

import type { TradingType } from '@suite-common/invity';

import { useSelector } from 'src/hooks/suite';
import {
    TradingDetailContextValues,
    TradingGetDetailDataOutputProps,
    TradingUseDetailOutputProps,
    TradingUseDetailProps,
} from 'src/types/trading/tradingDetail';
import { Trade, TradeBuy } from 'src/types/wallet/tradingCommonTypes';
import {
    TradingGetDetailDataProps,
    TradingGetTypedInfoTradeProps,
    TradingGetTypedTradeProps,
    TradingTradeInfoMapProps,
    TradingTradeMapProps,
} from 'src/types/trading/trading';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';

const isBuyTrade = (trade: Trade): trade is TradeBuy => trade.tradeType === 'buy';

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
        case 'exchange': {
            const { exchangeInfo } = trading.exchange;

            return exchangeInfo as TradingTradeInfoMapProps[T];
        }
        default: {
            const { buyInfo } = trading.buy;

            return buyInfo as TradingTradeInfoMapProps[T];
        }
    }
};

const getTradingDetailData = <T extends TradingType>({
    trading,
    tradeType,
}: TradingGetDetailDataProps): TradingGetDetailDataOutputProps<T> => {
    const { trades } = trading;
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
    const { account } = selectedAccount;
    const { info, transactionId, trade } = getTradingDetailData<T>({
        trading,
        tradeType,
    });

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
