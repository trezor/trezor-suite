import { useEffect } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingSellFormProps,
    selectTradingSelectedPaymentMethodByType,
    sellThunks,
    tradingActions,
    tradingSellActions,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';

import { useStore } from 'src/hooks/suite/useStore';
import { isSellQuotesFetchAllowed } from 'src/utils/wallet/trading/sellQuotesRequestUtils';

import { useTradingQuoteRequest } from '../common/useTradingQuoteRequest';

type UseSellQuotesProps = {
    methods: UseFormReturn<TradingSellFormProps>;
    network: Network | undefined;
    shouldSendInSats: boolean | undefined;
    composeRequestCallback: () => void;
};

const SELL_IMMEDIATE_FIELDS = [
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
] as const;

const SELL_DEBOUNCED_FIELDS = [TRADING_FORM_OUTPUT_AMOUNT] as const;

export const useSellQuotes = ({
    methods,
    network,
    shouldSendInSats,
    composeRequestCallback,
}: UseSellQuotesProps) => {
    const dispatch = useDispatch();
    const store = useStore();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const { isScheduledQuotesRefresh } = useTradingQuoteRequest({
        methods,
        immediateFields: SELL_IMMEDIATE_FIELDS,
        debouncedFields: SELL_DEBOUNCED_FIELDS,
        isFetchAllowed: isSellQuotesFetchAllowed,
        requestQuotes: values =>
            network
                ? dispatch(
                      sellThunks.handleRequestThunk({
                          formValues: values,
                          network,
                          shouldSendInSats,
                          composeRequestCallback,
                      }),
                  )
                : null,
        stopScheduler: () => dispatch(tradingActions.stopRefetchQuotes()),
        onResolved: (quotes, values) => {
            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'sell',
                    count: quotes.length,
                },
            });

            const selectedPaymentMethod = values.paymentMethod?.value;
            const paymentMethodOption = selectTradingSelectedPaymentMethodByType(
                store.getState(),
                'sell',
                selectedPaymentMethod,
            );

            if (paymentMethodOption && paymentMethodOption.value !== selectedPaymentMethod) {
                methods.setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, paymentMethodOption);
            }
        },
        isRequestContextAvailable: !!network,
    });

    useEffect(() => {
        if (!network) {
            dispatch(tradingSellActions.clearQuotes());
        }
    }, [network, dispatch]);

    return { isScheduledQuotesRefresh };
};
