import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import type { BuyCryptoPaymentMethod, BuyTrade } from 'invity-api';

import {
    type TradingAmountLimitProps,
    cryptoIdToNetwork,
    selectTradingBuyQuotesRequest,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';
import { truncateDecimals } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '@suite-native/trading-consts';
import {
    selectBuyAmountLimits,
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
    selectValidTradingBuyQuotesNative,
} from '@suite-native/trading-state';
import { type BuyFormType, type BuyFormValues } from '@suite-native/trading-types';

import { buyFormValidationSchema } from '../../utils/buy/buyFormValidationSchema';
import { useContextForTradingForm } from '../general/form/useContextForTradingForm';
import { useCountryChangeEffect } from '../general/form/useCountryChangeEffect';
import { useProviderMetadataChangeEffect } from '../general/form/useProviderMetadataChangeEffect';
import { useReceiveAccountChangeEffect } from '../general/form/useReceiveAccountChangeEffect';
import { useReceiveAccountPreselectionEffect } from '../general/form/useReceiveAccountPreselectionEffect';

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

const useBuyQuoteChangeEffect = ({ control, getValues, setValue }: BuyFormType) => {
    const [asset, quote] = useWatch({ control, name: ['asset', 'quote'] });
    const symbol = getSymbolFromTradeableAsset(asset);

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        if (quote && quote.receiveCurrency !== asset?.cryptoId) {
            return;
        }

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
    }, [asset?.cryptoId, quote, isAmountInSats, symbol, getValues, setValue]);
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
    const { context, setContractAddress, setSendNetworkSymbol } = useContextForTradingForm(limits);

    const form = useForm<BuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
        context,
    });
    const { control, setValue } = form;
    const asset = useWatch({ control, name: 'asset' });

    useEffect(() => {
        setContractAddress(asset?.contractAddress);
        setSendNetworkSymbol(cryptoIdToNetwork(asset?.cryptoId)?.symbol);
    }, [asset?.contractAddress, asset?.cryptoId, setContractAddress, setSendNetworkSymbol]);

    useReceiveAccountChangeEffect(setValue, selectBuySelectedReceiveAccount);
    useReceiveAccountPreselectionEffect({
        receiveAsset: asset,
        selectReceiveAccount: selectBuySelectedReceiveAccount,
        tradingType: 'buy',
    });
    useBuyQuotesChangeEffect(form);
    useBuyQuoteChangeEffect(form);
    useValidations(form, limits);
    useCountryChangeEffect(control);
    useProviderMetadataChangeEffect(control, 'buy');

    return form;
};

export const clearBuyFormQuoteData = (form: BuyFormType) => {
    form.setValue('quote', undefined);
    form.setValue('fiatValue', undefined, { shouldValidate: true });
    form.setValue('cryptoValue', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
