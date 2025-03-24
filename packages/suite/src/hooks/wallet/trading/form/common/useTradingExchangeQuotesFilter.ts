import { useEffect, useMemo } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import { ExchangeTrade } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TradingExchangeFormProps,
    TradingExchangeFormType,
    TradingExchangeRateType,
    exchangeUtils,
} from '@suite-common/trading';

interface TradingExchangeQuotesFilterProps {
    quotes: ExchangeTrade[] | undefined;
    exchangeType: TradingExchangeFormType;
    rateType: TradingExchangeRateType;
    exchangeInfo: any;
    setValue: UseFormSetValue<TradingExchangeFormProps>;
}

export const useTradingExchangeQuotesFilter = ({
    exchangeType,
    rateType,
    quotes,
    exchangeInfo,
    setValue,
}: TradingExchangeQuotesFilterProps) => {
    const dexQuotes = useMemo(() => quotes?.filter(quote => quote.isDex), [quotes]);
    const cexQuotes = useMemo(
        () => exchangeUtils.getCexQuotesByRateType(rateType, quotes, exchangeInfo),
        [rateType, quotes, exchangeInfo],
    );

    // handle edge case when there are no longer quotes of selected exchange type
    useEffect(() => {
        const isSelectedDexButFoundOnlyCex =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes?.length && cexQuotes?.length;
        const isSelectedCexButFoundOnlyDex =
            exchangeType === TRADING_EXCHANGE_FORM_CEX && dexQuotes?.length && !cexQuotes?.length;
        const isSelectedDexButNotFoundAny =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes?.length && !cexQuotes?.length;

        if (isSelectedDexButFoundOnlyCex) {
            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
        } else if (isSelectedCexButFoundOnlyDex) {
            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_DEX);
        } else if (isSelectedDexButNotFoundAny) {
            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
        }
    }, [dexQuotes, exchangeType, cexQuotes, setValue]);

    return {
        dexQuotes,
        cexQuotes,
    };
};
