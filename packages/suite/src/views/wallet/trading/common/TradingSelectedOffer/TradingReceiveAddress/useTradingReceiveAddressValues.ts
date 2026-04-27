import { type ExchangeTrade } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingTradeBuyExchangeType,
} from '@suite-common/trading';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
export const useTradingReceiveAddressValues = () => {
    const context = useTradingFormContext<TradingTradeBuyExchangeType>();
    const {
        tradingReceiveAddress,
        form: {
            state: { isFormLoading, isFormInvalid },
        },
        quotes,
    } = context;

    const cryptoId = isTradingExchangeContext(context)
        ? context.getValues().receiveCryptoSelect?.id
        : context.getValues().cryptoSelect?.id;

    if (!cryptoId) {
        throw new Error('cryptoId must be defined');
    }

    const isLoadingQuote = isTradingExchangeContext(context) && context.isLoadingQuote;
    const isLoading = (isFormLoading && !isFormInvalid) || isLoadingQuote;

    const getQuote = () => {
        if (isTradingExchangeContext(context)) {
            if (context.getValues(TRADING_EXCHANGE_FORM) === TRADING_EXCHANGE_FORM_DEX) {
                return context.dexQuotes?.[0];
            }

            return context.cexQuotes?.[0];
        }

        return quotes?.[0];
    };

    const quote = getQuote();
    const extraFieldDescription = isTradingExchangeContext(context)
        ? (quote as ExchangeTrade)?.extraFieldDescription
        : undefined;

    return { cryptoId, tradingReceiveAddress, quote, extraFieldDescription, isLoading };
};
