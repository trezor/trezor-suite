import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import {
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER,
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_RATE,
    TRADING_EXCHANGE_RATE_FLOATING,
    type TradingExchangeFormType,
    type TradingExchangeKycFilter,
    type TradingExchangeRateFilter,
    type TradingExchangeRateType,
    buildTradingBaseCurrencyOptionFromFiat,
    buildTradingFiatOption,
    getSupportedFiatCurrencyWithFallback,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type AccountKey, type FormState, type Output } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingDefaultSellAsset } from './common/useTradingDefaultSellAsset';

export const useTradingExchangeFormDefaultValues = (accountKey: AccountKey, cryptoId: CryptoId) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const defaultCurrency = useMemo(
        () =>
            // Here, we are using BaseCurrency as a way how to determine the users preferred Sell/Buy currency,
            // however, they may not be available (or it is 'btc'). In that case, we fall back to 'usd'
            buildTradingFiatOption(getSupportedFiatCurrencyWithFallback(baseCurrencyCode)),
        [baseCurrencyCode],
    );
    const { account, defaultAsset } = useTradingDefaultSellAsset({ accountKey, cryptoId });
    const { address, token } = resolveAddressAndToken(account, defaultAsset?.contractAddress);

    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            currency: buildTradingBaseCurrencyOptionFromFiat(defaultCurrency.value),
            address,
            token,
        }),
        [address, defaultCurrency, token],
    );
    const defaultFormState: FormState = useMemo(
        () => ({
            ...DEFAULT_VALUES,
            selectedUtxos: [],
            options: ['broadcast'],
            outputs: [defaultPayment],
        }),
        [defaultPayment],
    );
    const defaultValues = useMemo(
        () => ({
            ...defaultFormState,
            amountInCrypto: true,
            sendCryptoSelect: defaultAsset,
            receiveCryptoSelect: null,
            receiveAddress: undefined,
            [TRADING_EXCHANGE_RATE]: TRADING_EXCHANGE_RATE_FLOATING as TradingExchangeRateType,
            [TRADING_EXCHANGE_FORM]: TRADING_EXCHANGE_FORM_CEX as TradingExchangeFormType,
            [TRADING_EXCHANGE_COMPARATOR_KYC_FILTER]:
                TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL as TradingExchangeKycFilter,
            [TRADING_EXCHANGE_COMPARATOR_RATE_FILTER]:
                TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL as TradingExchangeRateFilter,
        }),
        [defaultAsset, defaultFormState],
    );

    return { defaultValues, defaultCurrency };
};
