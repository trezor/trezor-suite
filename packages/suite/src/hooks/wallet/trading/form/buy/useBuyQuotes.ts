import { type UseFormReturn } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    TRADING_BUY_RECEIVE_ADDRESS,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingBuyFormProps,
    buyThunks,
    selectTradingSelectedPaymentMethodByType,
    tradingActions,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';

import { useDispatch } from 'src/hooks/suite';
import { useStore } from 'src/hooks/suite/useStore';
import { isBuyQuotesFetchAllowed } from 'src/utils/wallet/trading/buyQuotesRequestUtils';

import { useTradingQuoteRequest } from '../common/useTradingQuoteRequest';

type UseBuyQuotesProps = {
    methods: UseFormReturn<TradingBuyFormProps>;
    network: Network;
    shouldSendInSats: boolean | undefined;
};

const BUY_IMMEDIATE_FIELDS = [
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_BUY_RECEIVE_ADDRESS,
] as const;

const BUY_DEBOUNCED_FIELDS = [TRADING_FORM_FIAT_INPUT, TRADING_FORM_CRYPTO_INPUT] as const;

export const useBuyQuotes = ({ methods, network, shouldSendInSats }: UseBuyQuotesProps) => {
    const dispatch = useDispatch();
    const store = useStore();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const { isScheduledQuotesRefresh } = useTradingQuoteRequest({
        methods,
        immediateFields: BUY_IMMEDIATE_FIELDS,
        debouncedFields: BUY_DEBOUNCED_FIELDS,
        isFetchAllowed: isBuyQuotesFetchAllowed,
        requestQuotes: values =>
            dispatch(
                buyThunks.handleRequestThunk({ formValues: values, network, shouldSendInSats }),
            ),
        stopScheduler: () => dispatch(tradingActions.stopRefetchQuotes()),
        onResolved: (quotes, values) => {
            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'buy',
                    count: quotes.length,
                },
            });

            const selectedPaymentMethod = values.paymentMethod?.value;
            const paymentMethodOption = selectTradingSelectedPaymentMethodByType(
                store.getState(),
                'buy',
                selectedPaymentMethod,
            );

            if (paymentMethodOption && paymentMethodOption.value !== selectedPaymentMethod) {
                methods.setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, paymentMethodOption);
            }
        },
    });

    return { isScheduledQuotesRefresh };
};
