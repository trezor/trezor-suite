import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingAmountLimitProps,
    TradingPaymentMethodListProps,
    TradingRootState,
    selectBestBuyQuoteByPaymentMethod,
    selectTradingBuyQuoteByQuoteId,
    selectTradingBuyQuotesRequest,
    selectValidTradingBuyQuotes,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { SettingsSliceRootState, selectIsAmountInSats } from '@suite-native/settings';

import {
    selectBuyAmountLimits,
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
} from '../selectors/buySelectors';
import { setBuySelectedReceiveAccount } from '../tradingSlice';
import { TradingBuyForm, TradingBuyFormValues } from '../types';
import { buyFormValidationSchema } from '../utils/buyFormValidationSchema';
import { getSelectedSymbolFromBuyForm } from '../utils/tradeableAssetUtils';

const useReceiveAccountChangeEffect = (form: TradingBuyForm) => {
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    useEffect(() => {
        form.setValue('receiveAccount', selectedReceiveAccount);
    }, [form, selectedReceiveAccount]);
};

const useAmountAndCurrencyFieldsChangeEffect = (form: TradingBuyForm) => {
    const dispatch = useDispatch();
    const prevNetworkId = useRef<string | undefined>(undefined);

    useEffect(() => {
        const { unsubscribe } = form.watch(({ focusedValue, asset }, { name }) => {
            switch (name) {
                case 'fiatValue':
                    if (focusedValue === 'fiatValue') {
                        form.setValue('cryptoValue', undefined);
                        form.setValue('amountInCrypto', false);
                        form.trigger('cryptoValue');
                    }
                    break;

                case 'cryptoValue':
                    if (focusedValue === 'cryptoValue') {
                        form.setValue('fiatValue', undefined);
                        form.setValue('amountInCrypto', true);
                        form.trigger('fiatValue');
                    }
                    break;

                case 'fiatCurrency':
                    form.setValue('cryptoValue', undefined);
                    form.setValue('fiatValue', undefined);
                    form.trigger(['cryptoValue', 'fiatValue']);
                    break;

                case 'asset': {
                    form.setValue('cryptoValue', undefined);
                    form.trigger('cryptoValue');

                    if (asset?.networkId !== prevNetworkId.current) {
                        prevNetworkId.current = asset?.networkId;
                        dispatch(
                            setBuySelectedReceiveAccount({ selectedReceiveAccount: undefined }),
                        );
                    }
                    break;
                }

                default:
                    // do nothing
                    break;
            }
        });

        return unsubscribe;
    }, [form, dispatch]);
};

const useQuotesChangeEffect = (form: TradingBuyForm) => {
    const quotes = useSelector(selectValidTradingBuyQuotes);

    useEffect(() => {
        const currentPaymentMethodValue = form.getValues('paymentMethod')?.value;

        let selectedQuote = quotes.find(
            ({ paymentMethod }) => paymentMethod === currentPaymentMethodValue,
        );

        if (!selectedQuote) {
            selectedQuote = quotes.find(({ paymentMethod }) => paymentMethod === 'creditCard');
        }

        if (!selectedQuote) {
            selectedQuote = quotes[0];
        }

        if (!selectedQuote) {
            form.setValue('paymentMethod', undefined);

            return;
        }

        form.setValue('quoteId', selectedQuote?.quoteId);
        form.setValue('paymentMethod', {
            value: selectedQuote.paymentMethod,
            label: selectedQuote.paymentMethodName,
        } as TradingPaymentMethodListProps);
    }, [quotes, form]);
};

const usePaymentMethodChangeEffect = (form: TradingBuyForm) => {
    const paymentMethod = form.watch('paymentMethod');
    const symbol = getSelectedSymbolFromBuyForm(form);
    const selectedQuote = useSelector((state: TradingRootState) =>
        selectBestBuyQuoteByPaymentMethod(state, paymentMethod?.value),
    );

    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [provider, amountInCrypto, fiatValue, cryptoValue, quoteId] = form.getValues([
            'provider',
            'amountInCrypto',
            'fiatValue',
            'cryptoValue',
            'quoteId',
        ]);

        if (selectedQuote?.exchange !== provider) {
            form.setValue('provider', selectedQuote?.exchange);
        }

        if (amountInCrypto && fiatValue !== selectedQuote?.fiatStringAmount) {
            form.setValue('fiatValue', selectedQuote?.fiatStringAmount);
        }

        if (!amountInCrypto && cryptoValue !== selectedQuote?.receiveStringAmount) {
            const value =
                isAmountInSats && selectedQuote?.receiveStringAmount && symbol
                    ? amountToSmallestUnit(
                          selectedQuote.receiveStringAmount,
                          getNetwork(symbol).decimals,
                      )
                    : selectedQuote?.receiveStringAmount;
            form.setValue('cryptoValue', value);
        }

        if (selectedQuote?.quoteId !== quoteId) {
            form.setValue('quoteId', selectedQuote?.quoteId);
        }
    }, [selectedQuote, isAmountInSats, symbol, form]);
};

const useQuoteQuoteIdChangeEffect = (form: TradingBuyForm) => {
    const quoteId = form.watch('quoteId');

    const symbol = getSelectedSymbolFromBuyForm(form);
    const selectedQuote = useSelector((state: TradingRootState) =>
        selectTradingBuyQuoteByQuoteId(state, quoteId),
    );

    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [amountInCrypto, fiatValue, cryptoValue, provider] = form.getValues([
            'amountInCrypto',
            'fiatValue',
            'cryptoValue',
            'provider',
        ]);

        if (amountInCrypto && fiatValue !== selectedQuote?.fiatStringAmount) {
            form.setValue('fiatValue', selectedQuote?.fiatStringAmount);
        }

        if (!amountInCrypto && cryptoValue !== selectedQuote?.receiveStringAmount) {
            const value =
                isAmountInSats && selectedQuote?.receiveStringAmount && symbol
                    ? amountToSmallestUnit(
                          selectedQuote.receiveStringAmount,
                          getNetwork(symbol).decimals,
                      )
                    : selectedQuote?.receiveStringAmount;
            form.setValue('cryptoValue', value);
        }

        if (selectedQuote?.exchange !== provider) {
            form.setValue('provider', selectedQuote?.exchange);
        }
    }, [selectedQuote, isAmountInSats, symbol, form]);
};

const useValidations = (form: TradingBuyForm, limits: TradingAmountLimitProps | undefined) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectValidTradingBuyQuotes);
    const quoteRequest = useSelector(selectTradingBuyQuotesRequest);
    const prevLimits = useRef<TradingAmountLimitProps | undefined>(undefined);

    if (prevLimits.current !== limits) {
        prevLimits.current = limits;
        form.trigger(['fiatValue', 'cryptoValue']);
    }

    const generalAlertMsg =
        !quoteRequest || quotes.length > 0 || limits
            ? undefined
            : translate('moduleTrading.validators.noQuotes');

    if (generalAlertMsg !== form.getValues('generalAlert')) {
        form.setValue('generalAlert', generalAlertMsg);
    }
};

export const useTradingBuyForm = (): TradingBuyForm => {
    const { translate } = useTranslate();
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const defaultValues = useSelector(selectBuyFormDefaultValues);
    const limits = useSelector(selectBuyAmountLimits);

    const form = useForm<TradingBuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
        context: { ...limits, translate, FiatAmountFormatter, CryptoAmountFormatter },
    });

    useAmountAndCurrencyFieldsChangeEffect(form);
    useReceiveAccountChangeEffect(form);
    useQuotesChangeEffect(form);
    usePaymentMethodChangeEffect(form);
    useQuoteQuoteIdChangeEffect(form);
    useValidations(form, limits);

    return form;
};

export const clearTradingBuyFormQuoteData = (form: TradingBuyForm) => {
    form.setValue('provider', undefined);
    form.setValue('quoteId', undefined);
    form.setValue('fiatValue', undefined);
    form.setValue('cryptoValue', undefined);
    form.setValue('paymentMethod', undefined);
    form.setValue('generalAlert', undefined);
    form.trigger(['fiatValue', 'cryptoValue']);
};
