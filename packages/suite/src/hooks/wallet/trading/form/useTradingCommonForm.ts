import { useContext } from 'react';

import type { TradingType } from '@suite-common/trading';

import { type TradingFormContextValues } from 'src/types/trading/tradingForm';
import { TradingBuyFormContext } from 'src/views/wallet/trading/buy/TradingBuyContext';
import { TradingExchangeFormContext } from 'src/views/wallet/trading/exchange/TradingExchangeContext';
import { TradingSellFormContext } from 'src/views/wallet/trading/sell/TradingSellContext';

export const useTradingFormContext = <
    T extends TradingType = TradingType,
>(): TradingFormContextValues<T> => {
    const buyCtx = useContext(TradingBuyFormContext);
    const sellCtx = useContext(TradingSellFormContext);
    const exchangeCtx = useContext(TradingExchangeFormContext);

    const activeContexts = [buyCtx, sellCtx, exchangeCtx].filter(context => context !== null);

    if (activeContexts.length !== 1) {
        throw Error('TradingFormContext used without single Context');
    }

    const [context] = activeContexts;

    return context as TradingFormContextValues<T>;
};
