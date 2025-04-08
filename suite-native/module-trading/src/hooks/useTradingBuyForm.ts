import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TradingPaymentMethodListProps,
    getBestRatedQuote,
    getTradingQuotesByPaymentMethod,
    selectTradingBuyQuotes,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { getNetwork } from '@suite-common/wallet-config';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { useForm } from '@suite-native/forms';
import { SettingsSliceRootState, selectIsAmountInSats } from '@suite-native/settings';

import {
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
} from '../selectors/buySelectors';
import { setBuySelectedReceiveAccount } from '../tradingSlice';
import { TradingBuyForm, TradingBuyFormValues } from '../types';
import { getSelectedSymbolFromBuyForm } from '../utils/tradeableAssetUtils';

const buyFormValidationSchema = yup.object({});

const useAssetChangeEffect = (form: TradingBuyForm) => {
    const dispatch = useDispatch();

    const asset = form.watch('asset');

    useEffect(() => {
        form.setValue('cryptoValue', undefined);
    }, [form, asset]);

    useEffect(() => {
        if (asset?.cryptoId !== undefined) {
            dispatch(setBuySelectedReceiveAccount({ selectedReceiveAccount: undefined }));
        }
    }, [dispatch, asset?.cryptoId]);
};

const useReceiveAccountChangeEffect = (form: TradingBuyForm) => {
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    useEffect(() => {
        form.setValue('receiveAccount', selectedReceiveAccount);
    }, [form, selectedReceiveAccount]);
};

const useFiatCurrencyChangeEffect = (form: TradingBuyForm) => {
    const fiatCurrency = form.watch('fiatCurrency');

    useEffect(() => {
        form.setValue('cryptoValue', undefined);
        form.setValue('fiatValue', undefined);
    }, [form, fiatCurrency]);
};

const useFiatValueChangeEffect = (form: TradingBuyForm) => {
    const fiatValue = form.watch('fiatValue');

    useEffect(() => {
        if (form.getValues('focusedValue') === 'fiatValue') {
            form.setValue('cryptoValue', undefined);
            form.setValue('amountInCrypto', false);
        }
    }, [form, fiatValue]);
};

const useCryptoValueChangeEffect = (form: TradingBuyForm) => {
    const cryptoValue = form.watch('cryptoValue');

    useEffect(() => {
        if (form.getValues('focusedValue') === 'cryptoValue') {
            form.setValue('fiatValue', undefined);
            form.setValue('amountInCrypto', true);
        }
    }, [form, cryptoValue]);
};

const useQuotesChangeEffect = (form: TradingBuyForm) => {
    const quotes = useSelector(selectTradingBuyQuotes);

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

        form.setValue('paymentMethod', {
            value: selectedQuote.paymentMethod,
            label: selectedQuote.paymentMethodName,
        } as TradingPaymentMethodListProps);
    }, [quotes, form]);
};

const usePaymentMethodChangeEffect = (form: TradingBuyForm) => {
    const paymentMethod = form.watch('paymentMethod');
    const symbol = getSelectedSymbolFromBuyForm(form);
    const allQuotes = useSelector(selectTradingBuyQuotes);
    const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<'buy'>(
        allQuotes,
        paymentMethod?.value ?? '',
    );
    const selectedQuote = getBestRatedQuote(quotesByPaymentMethod, 'buy');

    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [provider, amountInCrypto, fiatValue, cryptoValue, orderId] = form.getValues([
            'provider',
            'amountInCrypto',
            'fiatValue',
            'cryptoValue',
            'orderId',
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

        if (selectedQuote?.orderId !== orderId) {
            form.setValue('orderId', selectedQuote?.orderId);
        }
    }, [selectedQuote, isAmountInSats, symbol, form]);
};

export const useTradingBuyForm = (): TradingBuyForm => {
    const defaultValues = useSelector(selectBuyFormDefaultValues);

    const form = useForm<TradingBuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
    });

    useAssetChangeEffect(form);
    useReceiveAccountChangeEffect(form);
    useFiatCurrencyChangeEffect(form);
    useFiatValueChangeEffect(form);
    useCryptoValueChangeEffect(form);
    useQuotesChangeEffect(form);
    usePaymentMethodChangeEffect(form);

    return form;
};

export const clearTradingBuyFormQuoteData = (form: TradingBuyForm) => {
    form.setValue('provider', undefined);
    form.setValue('orderId', undefined);
    form.setValue('fiatValue', undefined);
    form.setValue('cryptoValue', undefined);
    form.setValue('paymentMethod', undefined);
};
