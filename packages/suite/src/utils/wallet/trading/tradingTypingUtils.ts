import { type CryptoId } from 'invity-api';

import {
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    type TradingBuyType,
    type TradingExchangeType,
    type TradingFiatCurrencyOption,
    type TradingSellType,
    type TradingType,
} from '@suite-common/trading';
import { type BaseCurrencyOption } from '@suite-common/wallet-types';

import {
    type TradingFormContextValues,
    type TradingFormMapProps,
} from 'src/types/trading/tradingForm';

export const isTradingBuyContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingBuyType] => context.type === 'buy';

export const isTradingSellContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingSellType] => context.type === 'sell';

export const isTradingExchangeContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingExchangeType] => context.type === 'exchange';

export const isTradingExchangeOrSellContext = (
    context: TradingFormMapProps[keyof TradingFormMapProps],
): context is TradingFormMapProps[TradingExchangeType] | TradingFormMapProps[TradingSellType] =>
    isTradingExchangeContext(context) || isTradingSellContext(context);

export const getSelectedCryptoId = (
    context: TradingFormContextValues<TradingType>,
): CryptoId | null => {
    if (isTradingExchangeContext(context)) {
        return context.getValues().receiveCryptoSelect?.id ?? null;
    }

    if (isTradingSellContext(context)) {
        return context.getValues().sendCryptoSelect?.id ?? null;
    }

    return context.getValues().cryptoSelect.id ?? null;
};

export const getSelectedTradingCurrency = (
    context: TradingFormContextValues<TradingType>,
): TradingFiatCurrencyOption | BaseCurrencyOption => {
    if (isTradingExchangeContext(context)) {
        return context.getValues(TRADING_FORM_OUTPUT_CURRENCY);
    }

    if (isTradingSellContext(context)) {
        return context.getValues(TRADING_FORM_OUTPUT_CURRENCY);
    }

    return context.getValues(TRADING_FORM_FIAT_CURRENCY_SELECT);
};
