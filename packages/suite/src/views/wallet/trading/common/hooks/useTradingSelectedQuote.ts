import { useFormContext, useWatch } from 'react-hook-form';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingExchangeFormType,
    type TradingPaymentMethodListProps,
    type TradingTradeMapProps,
    type TradingType,
    selectTradingSelectedQuoteByFormValues,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

type TradingSelectedQuoteFormFields = {
    provider?: string;
    paymentMethod?: TradingPaymentMethodListProps;
    exchangeType?: TradingExchangeFormType;
};

export const useTradingSelectedQuote = <T extends TradingType>(
    type: T,
): TradingTradeMapProps[T] | undefined => {
    const { control } = useFormContext<TradingSelectedQuoteFormFields>();
    const provider = useWatch({ control, name: TRADING_FORM_PROVIDER_SELECT });
    const paymentMethod = useWatch({ control, name: TRADING_FORM_PAYMENT_METHOD_SELECT });
    const exchangeType = useWatch({ control, name: TRADING_EXCHANGE_FORM });

    return useSelector(state =>
        selectTradingSelectedQuoteByFormValues(state, type, {
            provider,
            paymentMethod: paymentMethod?.value,
            exchangeType,
        }),
    );
};
