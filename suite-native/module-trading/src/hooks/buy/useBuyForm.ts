import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { BuyCryptoPaymentMethod, BuyTrade, CryptoId, FiatCurrencyCode } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingAmountLimitProps,
    getBestRatedQuote,
    invityAPI,
    selectTradingBuyQuotesRequest,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@suite-native/analytics';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '../../consts/general/consts';
import {
    selectBuyAmountLimits,
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
    selectValidTradingBuyQuotesNative,
} from '../../selectors/buySelectors';
import { tradingActions } from '../../tradingSlice';
import { BuyFormType, BuyFormValues } from '../../types/buy';
import { buyFormValidationSchema } from '../../utils/buy/buyFormValidationSchema';
import { truncateDecimals } from '../../utils/general/amountUtils';
import { getSelectedSymbolFromBuyForm } from '../../utils/general/tradeableAssetUtils';
import { getRandomAccountDescriptor } from '../../utils/general/utils';
import { useConvertFormValueToBaseUnit } from '../general/useConvertFormValueToBaseUnit';

const useReceiveAccountChangeEffect = ({ getValues, setValue }: BuyFormType) => {
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    // make sure invityAPIKey is initialized with some unique string on form mount
    useEffect(() => {
        invityAPI.createInvityAPIKey(getRandomAccountDescriptor());
    }, []);

    useEffect(() => {
        const prevReceiveAccount = getValues('receiveAccount');
        const descriptor = selectedReceiveAccount?.account?.descriptor;

        setValue('receiveAccount', selectedReceiveAccount);

        // when user changes receive account set invityAPIKey accordingly
        if (descriptor !== prevReceiveAccount?.account?.descriptor) {
            invityAPI.createInvityAPIKey(descriptor || getRandomAccountDescriptor());
        }
    }, [selectedReceiveAccount, getValues, setValue]);
};

const useAmountAndCurrencyFieldsChangeEffect = ({ setValue, getValues, watch }: BuyFormType) => {
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
                            analytics.report({
                                type: EventType.TradingParameterChanged,
                                payload: {
                                    type: 'buy',
                                    parameter: 'fiat',
                                },
                            });
                            prevFiatCurrency.current = fiatCurrency;
                            setValue('fiatValue', undefined, { shouldValidate: true });
                            setValue('cryptoValue', undefined, { shouldValidate: true });
                            dispatch(tradingActions.buyFiatCurrencyChanged());
                        }
                        break;

                    case 'asset': {
                        if (asset?.cryptoId !== prevCryptoId.current) {
                            analytics.report({
                                type: EventType.TradingParameterChanged,
                                payload: {
                                    type: 'buy',
                                    parameter: 'cryptoTo',
                                },
                            });
                            prevCryptoId.current = asset?.cryptoId as CryptoId | undefined;
                            setValue('cryptoValue', undefined, { shouldValidate: true });
                            dispatch(tradingActions.buyAssetChanged());
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

const useBuyQuotesChangeEffect = ({ getValues, setValue }: BuyFormType) => {
    const quotes = useSelector(selectValidTradingBuyQuotesNative);

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

        const preferredPaymentMethod: BuyCryptoPaymentMethod = Platform.select({
            ios: 'applePay',
            android: 'googlePay',
            default: 'creditCard',
        });

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes.filter(
                ({ paymentMethod }) => paymentMethod === preferredPaymentMethod,
            );
        }

        const defaultPaymentMethod = 'creditCard';
        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes.filter(
                ({ paymentMethod }) => paymentMethod === defaultPaymentMethod,
            );
        }

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes;
        }

        const selectedQuote = getBestRatedQuote(quoteCandidates, 'buy');
        setValue('quote', selectedQuote);
    }, [quotes, getValues, setValue]);
};

const useBuyQuoteChangeEffect = (form: BuyFormType) => {
    const { getValues, setValue, watch } = form;
    const quote = watch('quote');
    const symbol = getSelectedSymbolFromBuyForm(form);

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [amountInCrypto, fiatValue, cryptoValue] = getValues([
            'amountInCrypto',
            'fiatValue',
            'cryptoValue',
        ]);
        const truncatedFiatAmount = truncateDecimals(quote?.fiatStringAmount, MAX_FIAT_DECIMALS);

        const truncatedCryptoAmount = truncateDecimals(
            quote?.receiveStringAmount,
            MAX_CRYPTO_DECIMALS,
        );

        if (amountInCrypto && fiatValue !== truncatedFiatAmount) {
            setValue('fiatValue', truncatedFiatAmount);
        }

        if (!amountInCrypto && cryptoValue !== truncatedCryptoAmount) {
            const value =
                isAmountInSats && truncatedCryptoAmount && symbol
                    ? amountToSmallestUnit(truncatedCryptoAmount, getNetwork(symbol).decimals)
                    : truncatedCryptoAmount;
            setValue('cryptoValue', value);
        }
    }, [quote, isAmountInSats, symbol, getValues, setValue]);
};

const useValidations = (
    { trigger, setValue }: BuyFormType,
    limits: TradingAmountLimitProps | undefined,
) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectValidTradingBuyQuotesNative);
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

export const useBuyForm = (): BuyFormType => {
    const { translate } = useTranslate();
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const defaultValues = useSelector(selectBuyFormDefaultValues);
    const limits = useSelector(selectBuyAmountLimits);
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    const form = useForm<BuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
        context: {
            ...limits,
            translate,
            FiatAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
        },
    });

    useAmountAndCurrencyFieldsChangeEffect(form);
    useReceiveAccountChangeEffect(form);
    useBuyQuotesChangeEffect(form);
    useBuyQuoteChangeEffect(form);
    useValidations(form, limits);

    return form;
};

export const clearBuyFormQuoteData = (form: BuyFormType) => {
    form.setValue('quote', undefined);
    form.setValue('fiatValue', undefined, { shouldValidate: true });
    form.setValue('cryptoValue', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
