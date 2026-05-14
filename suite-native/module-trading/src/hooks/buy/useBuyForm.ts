import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import type { BuyCryptoPaymentMethod, BuyTrade, CryptoId, FiatCurrencyCode } from 'invity-api';

import { type TradingAmountLimitProps, selectTradingBuyQuotesRequest } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { events } from '@suite-native/analytics';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '@suite-native/trading-consts';
import {
    buyActions,
    selectBuyAmountLimits,
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
    selectValidTradingBuyQuotesNative,
} from '@suite-native/trading-state';
import { type BuyFormType, type BuyFormValues } from '@suite-native/trading-types';

import { buyFormValidationSchema } from '../../utils/buy/buyFormValidationSchema';
import { truncateDecimals } from '../../utils/general/amountUtils';
import { useContextForTradingForm } from '../general/form/useContextForTradingForm';
import { useCountryChangeEffect } from '../general/form/useCountryChangeEffect';
import { useProviderMetadataChangeEffect } from '../general/form/useProviderMetadataChangeEffect';
import { useReceiveAccountChangeEffect } from '../general/form/useReceiveAccountChangeEffect';

const useAmountAndCurrencyFieldsChangeEffect = ({ setValue, getValues, watch }: BuyFormType) => {
    const dispatch = useDispatch();
    const prevCryptoId = useRef<CryptoId | undefined>(undefined);
    const prevFiatCurrency = useRef<FiatCurrencyCode | undefined>(getValues('fiatCurrency'));
    const analytics = useAnalytics();
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
                                type: events.tradingParameterChangedEvent.name,
                                payload: {
                                    type: 'buy',
                                    parameter: 'fiat',
                                },
                            });
                            prevFiatCurrency.current = fiatCurrency;
                            setValue('fiatValue', undefined, { shouldValidate: true });
                            setValue('cryptoValue', undefined, { shouldValidate: true });
                            dispatch(buyActions.fiatCurrencyChanged());
                        }
                        break;

                    case 'asset': {
                        if (asset?.cryptoId !== prevCryptoId.current) {
                            analytics.report({
                                type: events.tradingParameterChangedEvent.name,
                                payload: {
                                    type: 'buy',
                                    parameter: 'cryptoTo',
                                },
                            });
                            prevCryptoId.current = asset?.cryptoId as CryptoId | undefined;
                            setValue('cryptoValue', undefined, { shouldValidate: true });
                            dispatch(buyActions.assetChanged());
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
    }, [dispatch, analytics, setValue, watch]);
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

        setValue('quote', quoteCandidates[0]);
    }, [quotes, getValues, setValue]);
};

const useBuyQuoteChangeEffect = ({ getValues, setValue, watch }: BuyFormType) => {
    const [asset, quote] = watch(['asset', 'quote']);
    const symbol = getSymbolFromTradeableAsset(asset);

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
                    ? convertAmountUnitsToSubunits(
                          truncatedCryptoAmount,
                          getNetwork(symbol).decimals,
                      )
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
    const defaultValues = useSelector(selectBuyFormDefaultValues);
    const limits = useSelector(selectBuyAmountLimits);
    const { context } = useContextForTradingForm(limits);

    const form = useForm<BuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
        context,
    });
    const { setValue, watch } = form;

    useAmountAndCurrencyFieldsChangeEffect(form);
    useReceiveAccountChangeEffect(setValue, selectBuySelectedReceiveAccount);
    useBuyQuotesChangeEffect(form);
    useBuyQuoteChangeEffect(form);
    useValidations(form, limits);
    useCountryChangeEffect(watch);
    useProviderMetadataChangeEffect(watch, 'buy');

    return form;
};

export const clearBuyFormQuoteData = (form: BuyFormType) => {
    form.setValue('quote', undefined);
    form.setValue('fiatValue', undefined, { shouldValidate: true });
    form.setValue('cryptoValue', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
