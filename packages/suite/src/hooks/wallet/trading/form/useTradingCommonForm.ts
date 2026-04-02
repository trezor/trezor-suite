import { useContext } from 'react';

import type { TradingType } from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

import { type TradingFormContextValues } from 'src/types/trading/tradingForm';
import { TradingBuyFormContext } from 'src/views/wallet/trading/buy/TradingBuyContext';
import { TradingExchangeFormContext } from 'src/views/wallet/trading/exchange/TradingExchangeContext';
import { TradingSellFormContext } from 'src/views/wallet/trading/sell/TradingSellContext';

export function useTradingFormContext(
    tradingType: TradingType,
): TradingFormContextValues<TradingType> {
    const buyCtx = useContext(TradingBuyFormContext);
    const sellCtx = useContext(TradingSellFormContext);
    const exchangeCtx = useContext(TradingExchangeFormContext);

    switch (tradingType) {
        case 'buy':
            if (!buyCtx) {
                throw Error('useTradingFormContext used without Context');
            }

            return buyCtx;

        case 'sell':
            if (!sellCtx) {
                throw Error('useTradingFormContext used without Context');
            }

            return sellCtx;

        case 'exchange':
            if (!exchangeCtx) {
                throw Error('useTradingFormContext used without Context');
            }

            return exchangeCtx;

        default:
            return exhaustive(tradingType);
    }
}
