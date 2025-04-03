import { useEffect, useMemo } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import { ExchangeTrade } from 'invity-api';

import { exchangeUtils } from '@suite-common/trading';

import {
    FORM_EXCHANGE_CEX,
    FORM_EXCHANGE_DEX,
    FORM_EXCHANGE_TYPE,
} from 'src/constants/wallet/trading/form';
import type {
    ExchangeType,
    RateType,
    TradingExchangeFormProps,
} from 'src/types/trading/tradingForm';

interface TradingExchangeQuotesFilterProps {
    quotes: ExchangeTrade[] | undefined;
    exchangeType: ExchangeType;
    rateType: RateType;
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
            exchangeType === FORM_EXCHANGE_DEX && !dexQuotes?.length && cexQuotes?.length;
        const isSelectedCexButFoundOnlyDex =
            exchangeType === FORM_EXCHANGE_CEX && dexQuotes?.length && !cexQuotes?.length;
        const isSelectedDexButNotFoundAny =
            exchangeType === FORM_EXCHANGE_DEX && !dexQuotes?.length && !cexQuotes?.length;

        if (isSelectedDexButFoundOnlyCex) {
            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_CEX);
        } else if (isSelectedCexButFoundOnlyDex) {
            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_DEX);
        } else if (isSelectedDexButNotFoundAny) {
            setValue(FORM_EXCHANGE_TYPE, FORM_EXCHANGE_CEX);
        }
    }, [dexQuotes, exchangeType, cexQuotes, setValue]);

    return {
        dexQuotes,
        cexQuotes,
    };
};
