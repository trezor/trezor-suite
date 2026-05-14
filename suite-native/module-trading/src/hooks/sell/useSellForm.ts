import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { CryptoId, FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import {
    type TradingAmountLimitProps,
    selectTradingSellQuotesRequest,
    selectValidTradingSellQuotes,
} from '@suite-common/trading';
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
    selectSellAmountLimits,
    selectSellFormDefaultValues,
    selectSellSelectedSendAccount,
    sellActions,
} from '@suite-native/trading-state';
import { type SellFormType, type SellFormValues } from '@suite-native/trading-types';

import { truncateDecimals } from '../../utils/general/amountUtils';
import { sellFormValidationSchema } from '../../utils/sell/sellFormValidationSchema';
import { useContextForTradingForm } from '../general/form/useContextForTradingForm';
import { useCountryChangeEffect } from '../general/form/useCountryChangeEffect';
import { useProviderMetadataChangeEffect } from '../general/form/useProviderMetadataChangeEffect';
import { useSendAccountAssetBalance } from '../general/form/useSendAccountAssetBalance';
import { useSendAccountChangeEffect } from '../general/form/useSendAccountChangeEffect';

const useAmountAndCurrencyFieldsChangeEffect = ({ setValue, getValues, watch }: SellFormType) => {
    const dispatch = useDispatch();
    const prevCryptoId = useRef<CryptoId | undefined>(undefined);
    const prevFiatCurrency = useRef<FiatCurrencyCode | undefined>(getValues('fiatCurrency'));
    const analytics = useAnalytics();

    useEffect(() => {
        const { unsubscribe } = watch(
            ({ fiatCurrency, sendAsset, amountInCrypto, focusedValue }, { name, type }) => {
                switch (name) {
                    case 'fiatStringAmount':
                        if (type === 'change' && focusedValue === 'fiatStringAmount') {
                            setValue('cryptoStringAmount', undefined, { shouldValidate: true });
                            if (amountInCrypto) {
                                setValue('amountInCrypto', false);
                            }
                        }
                        break;

                    case 'cryptoStringAmount':
                        if (type === 'change' && focusedValue === 'cryptoStringAmount') {
                            setValue('fiatStringAmount', undefined, { shouldValidate: true });
                            if (!amountInCrypto) {
                                setValue('amountInCrypto', true);
                            }
                        }
                        break;

                    case 'sendAsset':
                        if (sendAsset?.cryptoId !== prevCryptoId.current) {
                            analytics.report({
                                type: events.tradingParameterChangedEvent.name,
                                payload: {
                                    type: 'sell',
                                    parameter: 'cryptoFrom',
                                },
                            });
                            prevCryptoId.current = sendAsset?.cryptoId as CryptoId | undefined;
                            setValue('cryptoStringAmount', undefined, { shouldValidate: true });
                            dispatch(sellActions.sendAssetChanged());
                        }
                        break;

                    case 'fiatCurrency':
                        if (fiatCurrency !== prevFiatCurrency.current) {
                            analytics.report({
                                type: events.tradingParameterChangedEvent.name,
                                payload: {
                                    type: 'sell',
                                    parameter: 'fiat',
                                },
                            });
                            prevFiatCurrency.current = fiatCurrency;
                            setValue('fiatStringAmount', undefined, { shouldValidate: true });
                            dispatch(sellActions.fiatCurrencyChanged());
                        }
                        break;

                    default:
                        // do nothing
                        break;
                }
            },
        );

        return unsubscribe;
    }, [setValue, watch, dispatch, analytics]);
};

const useSellQuotesChangeEffect = ({ getValues, setValue }: SellFormType) => {
    const quotes = useSelector(selectValidTradingSellQuotes);

    useEffect(() => {
        if (quotes.length === 0) {
            setValue('quote', undefined);

            return;
        }

        const currentQuote = getValues('quote');
        let quoteCandidates: SellFiatTrade[] = [];

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
            quoteCandidates = quotes.filter(
                ({ paymentMethod }) => paymentMethod === 'bankTransfer',
            );
        }

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes;
        }

        setValue('quote', quoteCandidates[0]);
    }, [quotes, getValues, setValue]);
};

const useSellQuoteChangeEffect = ({ getValues, setValue, watch }: SellFormType) => {
    const [sendAsset, quote] = watch(['sendAsset', 'quote']);
    const symbol = getSymbolFromTradeableAsset(sendAsset);

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [amountInCrypto, fiatValue, cryptoValue] = getValues([
            'amountInCrypto',
            'fiatStringAmount',
            'cryptoStringAmount',
        ]);
        const truncatedFiatAmount = truncateDecimals(quote?.fiatStringAmount, MAX_FIAT_DECIMALS);

        const truncatedCryptoAmount = truncateDecimals(
            quote?.cryptoStringAmount,
            MAX_CRYPTO_DECIMALS,
        );

        if (amountInCrypto && fiatValue !== truncatedFiatAmount) {
            setValue('fiatStringAmount', truncatedFiatAmount);
        }

        if (!amountInCrypto && cryptoValue !== truncatedCryptoAmount) {
            const value =
                isAmountInSats && truncatedCryptoAmount && symbol
                    ? convertAmountUnitsToSubunits(
                          truncatedCryptoAmount,
                          getNetwork(symbol).decimals,
                      )
                    : truncatedCryptoAmount;
            setValue('cryptoStringAmount', value, { shouldValidate: true });
        }
    }, [quote, isAmountInSats, symbol, getValues, setValue]);
};

const useValidations = (
    { trigger, setValue }: SellFormType,
    limits: TradingAmountLimitProps | undefined,
) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectValidTradingSellQuotes);
    const quoteRequest = useSelector(selectTradingSellQuotesRequest);

    const generalAlertMsg =
        !quoteRequest || quotes.length > 0 || limits
            ? undefined
            : translate('moduleTrading.validators.noQuotes');

    useEffect(() => {
        trigger(['cryptoStringAmount', 'fiatStringAmount']);
    }, [limits, trigger]);

    useEffect(() => {
        setValue('generalAlert', generalAlertMsg);
    }, [generalAlertMsg, setValue]);
};

export const useSellForm = (): SellFormType => {
    const defaultValues = useSelector(selectSellFormDefaultValues);
    const limits = useSelector(selectSellAmountLimits);
    const { context, setBalance, setSendSymbol, setContractAddress } =
        useContextForTradingForm(limits);

    const form = useForm<SellFormValues>({
        defaultValues,
        validation: sellFormValidationSchema,
        context,
    });

    const { watch } = form;

    useSendAccountChangeEffect(form.setValue, selectSellSelectedSendAccount);
    useAmountAndCurrencyFieldsChangeEffect(form);
    useSendAccountAssetBalance(form, setBalance, setSendSymbol, setContractAddress);
    useSellQuotesChangeEffect(form);
    useSellQuoteChangeEffect(form);
    useValidations(form, limits);
    useCountryChangeEffect(watch);
    useProviderMetadataChangeEffect(watch, 'sell');

    return form;
};

export const clearSellFormQuoteData = (form: SellFormType) => {
    form.setValue('quote', undefined);
    form.setValue('cryptoStringAmount', undefined, { shouldValidate: true });
    form.setValue('fiatStringAmount', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
