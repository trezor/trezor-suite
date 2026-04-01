import { useContext } from 'react';

import type { TradingType } from '@suite-common/trading';

import { type TradingFormContextValues } from 'src/types/trading/tradingForm';
import { TradingBuyFormContext } from 'src/views/wallet/trading/buy/TradingBuyContext';
import { TradingExchangeFormContext } from 'src/views/wallet/trading/exchange/TradingExchangeContext';
import { TradingSellFormContext } from 'src/views/wallet/trading/sell/TradingSellContext';

export const useTradingFormContext = <T extends TradingType>() => {
    const buyCtx = useContext(TradingBuyFormContext);
    const sellCtx = useContext(TradingSellFormContext);
    const exchangeCtx = useContext(TradingExchangeFormContext);

    let context;

    switch (true) {
        case buyCtx !== null:
            context = buyCtx;
            break;
        case sellCtx !== null:
            context = sellCtx;
            break;
        case exchangeCtx !== null:
            context = exchangeCtx;
            break;
        default:
            throw Error('TradingFormContext used without Context');
    }

    return context as TradingFormContextValues<T>;
};
