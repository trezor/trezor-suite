import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BuyTrade } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingAmountLimitProps,
    getBestRatedQuote,
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
        const { unsubscribe } = form.watch(
            ({ focusedValue, asset, amountInCrypto }, { name, type }) => {
                switch (name) {
                    case 'fiatValue':
                        if (focusedValue === 'fiatValue' && type === 'change') {
                            form.setValue('cryptoValue', undefined, { shouldValidate: true });
                            if (amountInCrypto) {
                                form.setValue('amountInCrypto', false);
                            }
                        }
                        break;

                    case 'cryptoValue':
                        if (focusedValue === 'cryptoValue' && type === 'change') {
                            form.setValue('fiatValue', undefined, { shouldValidate: true });
                            if (!amountInCrypto) {
                                form.setValue('amountInCrypto', true);
                            }
                        }
                        break;

                    case 'fiatCurrency':
                        form.setValue('fiatValue', undefined, { shouldValidate: true });
                        form.setValue('cryptoValue', undefined, { shouldValidate: true });
                        break;

                    case 'asset': {
                        form.setValue('cryptoValue', undefined, { shouldValidate: true });

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
            },
        );

        return unsubscribe;
    }, [form, dispatch]);
};

const useQuotesChangeEffect = (form: TradingBuyForm) => {
    const quotes = useSelector(selectValidTradingBuyQuotes);

    useEffect(() => {
        if (quotes.length === 0) {
            form.setValue('quote', undefined);

            return;
        }

        const currentQuote = form.getValues('quote');
        let quoteCandidates: BuyTrade[] = [];

        if (currentQuote) {
            quoteCandidates = quotes.filter(
                ({ paymentMethod, exchange }) =>
                    paymentMethod === currentQuote.paymentMethod &&
                    exchange === currentQuote.exchange,
            );

            if (quoteCandidates.length === 0) {
                quoteCandidates = quotes.filter(
                    ({ paymentMethod }) => paymentMethod === currentQuote.paymentMethod,
                );
            }
        }

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes.filter(({ paymentMethod }) => paymentMethod === 'creditCard');
        }

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes;
        }

        const selectedQuote = getBestRatedQuote(quoteCandidates, 'buy');
        form.setValue('quote', selectedQuote);
    }, [quotes, form]);
};

const useQuoteChangeEffect = (form: TradingBuyForm) => {
    const quote = form.watch('quote');
    const symbol = getSelectedSymbolFromBuyForm(form);

    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [amountInCrypto, fiatValue, cryptoValue] = form.getValues([
            'amountInCrypto',
            'fiatValue',
            'cryptoValue',
        ]);

        if (amountInCrypto && fiatValue !== quote?.fiatStringAmount) {
            form.setValue('fiatValue', quote?.fiatStringAmount);
        }

        if (!amountInCrypto && cryptoValue !== quote?.receiveStringAmount) {
            const value =
                isAmountInSats && quote?.receiveStringAmount && symbol
                    ? amountToSmallestUnit(quote.receiveStringAmount, getNetwork(symbol).decimals)
                    : quote?.receiveStringAmount;
            form.setValue('cryptoValue', value);
        }
    }, [quote, isAmountInSats, symbol, form]);
};

const useValidations = (form: TradingBuyForm, limits: TradingAmountLimitProps | undefined) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectValidTradingBuyQuotes);
    const quoteRequest = useSelector(selectTradingBuyQuotesRequest);

    const generalAlertMsg =
        !quoteRequest || quotes.length > 0 || limits
            ? undefined
            : translate('moduleTrading.validators.noQuotes');

    useEffect(() => {
        form.trigger(['fiatValue', 'cryptoValue']);
    }, [form, limits]);

    useEffect(() => {
        form.setValue('generalAlert', generalAlertMsg);
    }, [form, generalAlertMsg]);
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
    useQuoteChangeEffect(form);
    useValidations(form, limits);

    return form;
};

export const clearTradingBuyFormQuoteData = (form: TradingBuyForm) => {
    form.setValue('quote', undefined);
    form.setValue('fiatValue', undefined, { shouldValidate: true });
    form.setValue('cryptoValue', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
