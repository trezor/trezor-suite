import { useTimer } from '@trezor/react-utils';
import { useDevice } from 'src/hooks/suite';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { createContext, useContext, useMemo, useState } from 'react';
import {
    CoinmarketTradeBuyType,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeExchangeType,
    CoinmarketTradeSellType,
    CoinmarketTradeType,
    UseCoinmarketCommonProps,
    UseCoinmarketCommonReturnProps,
} from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketOffersContextValues,
    CoinmarketOffersMapProps,
} from 'src/types/coinmarket/coinmarketOffers';
import { useServerEnvironment } from 'src/hooks/wallet/coinmarket/useServerEnviroment';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';
import { FORM_EXCHANGE_DEX, FORM_EXCHANGE_TYPE } from 'src/constants/wallet/coinmarket/form';

export const isCoinmarketBuyOffers = (
    offersContext: CoinmarketOffersMapProps[keyof CoinmarketOffersMapProps],
): offersContext is CoinmarketOffersMapProps[CoinmarketTradeBuyType] =>
    offersContext.type === 'buy';

export const isCoinmarketSellOffers = (
    offersContext: CoinmarketOffersMapProps[keyof CoinmarketOffersMapProps],
): offersContext is CoinmarketOffersMapProps[CoinmarketTradeSellType] =>
    offersContext.type === 'sell';

export const isCoinmarketExchangeOffers = (
    offersContext: CoinmarketOffersMapProps[keyof CoinmarketOffersMapProps],
): offersContext is CoinmarketOffersMapProps[CoinmarketTradeExchangeType] =>
    offersContext.type === 'exchange';

export const getFilteredSuccessQuotes = <T extends CoinmarketTradeType>(
    quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
) => (quotes ? quotes.filter(q => q.error === undefined) : undefined);

export const useCoinmarketCommonOffers = ({
    type,
    selectedAccount,
}: UseCoinmarketCommonProps): UseCoinmarketCommonReturnProps => {
    const timer = useTimer();
    const { account } = selectedAccount;
    const { isLocked, device } = useDevice();
    const [callInProgress, setCallInProgress] = useState<boolean>(
        type !== 'buy' ? isLocked() : false,
    );

    const checkQuotesTimer = (callback: () => Promise<void>) => {
        if (!timer.isLoading && !timer.isStopped) {
            if (timer.resetCount >= 40) {
                timer.stop();
            }

            if (timer.timeSpend.seconds === InvityAPIReloadQuotesAfterSeconds) {
                callback();
            }
        }
    };

    useServerEnvironment();

    return {
        callInProgress,
        account,
        timer,
        device,
        setCallInProgress,
        checkQuotesTimer,
    };
};

export const useFilteredQuotesByRateTypeAndExchangeType = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
) => {
    const { quotes } = context;
    const isExchange = isCoinmarketExchangeOffers(context);
    const exchangeType = isExchange ? context.getValues(FORM_EXCHANGE_TYPE) : undefined;
    const dexQuotes = isExchange ? context.dexQuotes : undefined;

    return useMemo(
        () => (exchangeType === FORM_EXCHANGE_DEX ? dexQuotes : quotes),
        [dexQuotes, quotes, exchangeType],
    );
};

export const CoinmarketOffersContext =
    createContext<CoinmarketOffersContextValues<CoinmarketTradeType> | null>(null);

CoinmarketOffersContext.displayName = 'CoinmarketOffersContext';

export const useCoinmarketOffersContext = <T extends CoinmarketTradeType>() => {
    const context = useContext(CoinmarketOffersContext);
    if (context === null) throw Error('CoinmarketOffersContext used without Context');

    return context as CoinmarketOffersContextValues<T>;
};
