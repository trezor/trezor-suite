import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BuyTrade, CryptoId, FiatCurrencyCode } from 'invity-api';

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

const useReceiveAccountChangeEffect = ({ setValue }: TradingBuyForm) => {
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    useEffect(() => {
        setValue('receiveAccount', selectedReceiveAccount);
    }, [selectedReceiveAccount, setValue]);
};

const useAmountAndCurrencyFieldsChangeEffect = ({ setValue, getValues, watch }: TradingBuyForm) => {
    const dispatch = useDispatch();
    const prevCryptoId = useRef<CryptoId | undefined>(undefined);
    const prevFiatCurrency = useRef<FiatCurrencyCode | undefined>(getValues('fiatCurrency'));

    useEffect(() => {
        const { unsubscribe } = watch(
            ({ focusedValue, asset, amountInCrypto, fiatCurrency }, { name, type }) => {
                switch (name) {
                    case 'fiatValue':
                        if (focusedValue === 'fiatValue' && type === 'change') {
                            setValue('cryptoValue', undefined, { shouldValidate: true });
                            if (amountInCrypto) {
                                setValue('amountInCrypto', false);
                            }
                        }
                        break;

                    case 'cryptoValue':
                        if (focusedValue === 'cryptoValue' && type === 'change') {
                            setValue('fiatValue', undefined, { shouldValidate: true });
                            if (!amountInCrypto) {
                                setValue('amountInCrypto', true);
                            }
                        }
                        break;

                    case 'fiatCurrency':
                        if (fiatCurrency !== prevFiatCurrency.current) {
                            prevFiatCurrency.current = fiatCurrency;
                            setValue('fiatValue', undefined, { shouldValidate: true });
                            setValue('cryptoValue', undefined, { shouldValidate: true });
                        }
                        break;

                    case 'asset': {
                        if (asset?.cryptoId !== prevCryptoId.current) {
                            prevCryptoId.current = asset?.cryptoId as CryptoId | undefined;
                            setValue('cryptoValue', undefined, { shouldValidate: true });
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
    }, [dispatch, setValue, watch]);
};

const useQuotesChangeEffect = ({ getValues, setValue }: TradingBuyForm) => {
    const quotes = useSelector(selectValidTradingBuyQuotes);

    useEffect(() => {
        if (quotes.length === 0) {
            setValue('quote', undefined);

            return;
        }

        const currentQuote = getValues('quote');
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
        setValue('quote', selectedQuote);
    }, [quotes, getValues, setValue]);
};

const useQuoteChangeEffect = (form: TradingBuyForm) => {
    const { getValues, setValue, watch } = form;
    const quote = watch('quote');
    const symbol = getSelectedSymbolFromBuyForm(form);

    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [amountInCrypto, fiatValue, cryptoValue] = getValues([
            'amountInCrypto',
            'fiatValue',
            'cryptoValue',
        ]);

        if (amountInCrypto && fiatValue !== quote?.fiatStringAmount) {
            setValue('fiatValue', quote?.fiatStringAmount);
        }

        if (!amountInCrypto && cryptoValue !== quote?.receiveStringAmount) {
            const value =
                isAmountInSats && quote?.receiveStringAmount && symbol
                    ? amountToSmallestUnit(quote.receiveStringAmount, getNetwork(symbol).decimals)
                    : quote?.receiveStringAmount;
            setValue('cryptoValue', value);
        }
    }, [quote, isAmountInSats, symbol, getValues, setValue]);
};

const useValidations = (
    { trigger, setValue }: TradingBuyForm,
    limits: TradingAmountLimitProps | undefined,
) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectValidTradingBuyQuotes);
    const quoteRequest = useSelector(selectTradingBuyQuotesRequest);

    const generalAlertMsg =
        !quoteRequest || quotes.length > 0 || limits
            ? undefined
            : translate('moduleTrading.validators.noQuotes');

    useEffect(() => {
        trigger(['fiatValue', 'cryptoValue']);
    }, [limits, trigger]);

    useEffect(() => {
        setValue('generalAlert', generalAlertMsg);
    }, [generalAlertMsg, setValue]);
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
