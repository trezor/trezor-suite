import { useFormContext, useWatch } from 'react-hook-form';

import { type BuyTrade, type CoinExtraField, type CryptoId, type ExchangeTrade } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingExchangeFormType,
    type TradingPaymentMethodListProps,
    type TradingTradeBuyExchangeType,
    selectTradingBuyQuotesByPaymentMethod,
    selectTradingExchangeCexQuotes,
    selectTradingExchangeDexQuotes,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type useTradingReceiveAddress } from 'src/hooks/wallet/trading/form/useTradingReceiveAddress';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

type TradingReceiveAddressValues = {
    cryptoId: CryptoId;
    tradingReceiveAddress: ReturnType<typeof useTradingReceiveAddress>;
    quote: BuyTrade | ExchangeTrade | undefined;
    extraFieldDescription: CoinExtraField | undefined;
    isLoading: boolean;
};

type TradingReceiveAddressQuoteFormFields = {
    paymentMethod?: TradingPaymentMethodListProps;
    exchangeType?: TradingExchangeFormType;
};

export const useTradingReceiveAddressValues = (): TradingReceiveAddressValues => {
    const context = useTradingFormContext<TradingTradeBuyExchangeType>();
    const {
        tradingReceiveAddress,
        form: {
            state: { isFormLoading, isFormInvalid },
        },
    } = context;
    const { control } = useFormContext<TradingReceiveAddressQuoteFormFields>();
    const paymentMethod = useWatch({ control, name: TRADING_FORM_PAYMENT_METHOD_SELECT });
    const exchangeType = useWatch({ control, name: TRADING_EXCHANGE_FORM });

    const quote = useSelector(state => {
        if (isTradingExchangeContext(context)) {
            return exchangeType === TRADING_EXCHANGE_FORM_DEX
                ? selectTradingExchangeDexQuotes(state)[0]
                : selectTradingExchangeCexQuotes(state)[0];
        }

        return selectTradingBuyQuotesByPaymentMethod(state, paymentMethod?.value)[0];
    });

    const cryptoId = isTradingExchangeContext(context)
        ? context.getValues().receiveCryptoSelect?.id
        : context.getValues().cryptoSelect?.id;

    if (!cryptoId) {
        throw new Error('cryptoId must be defined');
    }

    const isLoadingQuote = isTradingExchangeContext(context) && context.isLoadingQuote;
    const isLoading = (isFormLoading && !isFormInvalid) || isLoadingQuote;

    const extraFieldDescription = isTradingExchangeContext(context)
        ? (quote as ExchangeTrade | undefined)?.extraFieldDescription
        : undefined;

    return { cryptoId, tradingReceiveAddress, quote, extraFieldDescription, isLoading };
};
