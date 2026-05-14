import { useEffect } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingExchangeFormProps,
    type TradingExchangeFormType,
    selectTradingExchangeCexQuotes,
    selectTradingExchangeDexQuotes,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

interface TradingExchangeQuotesFilterProps {
    exchangeType: TradingExchangeFormType;
    setValue: UseFormSetValue<TradingExchangeFormProps>;
}

export const useTradingExchangeQuotesFilter = ({
    exchangeType,
    setValue,
}: TradingExchangeQuotesFilterProps) => {
    const dexQuotes = useSelector(selectTradingExchangeDexQuotes);
    const cexQuotes = useSelector(selectTradingExchangeCexQuotes);

    // handle edge case when there are no longer quotes of selected exchange type
    useEffect(() => {
        const isSelectedDexButFoundOnlyCex =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes.length && cexQuotes.length;
        const isSelectedCexButFoundOnlyDex =
            exchangeType === TRADING_EXCHANGE_FORM_CEX && dexQuotes.length && !cexQuotes.length;
        const isSelectedDexButNotFoundAny =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes.length && !cexQuotes.length;

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
