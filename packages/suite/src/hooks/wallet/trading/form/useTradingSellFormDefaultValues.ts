import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import {
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingCountryCode,
    type TradingPaymentMethodListProps,
    buildTradingBaseCurrencyOptionFromFiat,
    buildTradingFiatOption,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    getSupportedFiatCurrencyWithFallback,
    regional,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type AccountKey, type FormState, type Output } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { type TradingSellFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingDefaultSellAsset } from './common/useTradingDefaultSellAsset';

export const useTradingSellFormDefaultValues = (
    accountKey: AccountKey,
    cryptoId: CryptoId,
    sellInfoCountry: TradingCountryCode | undefined,
    sellInfoCountrySubdivision?: string,
): TradingSellFormDefaultValuesProps => {
    const { isTorEnabled } = useSelector(selectTorState);

    const { account, defaultAsset } = useTradingDefaultSellAsset({
        accountKey,
        cryptoId,
    });
    const country = !isTorEnabled ? sellInfoCountry : regional.UNKNOWN_COUNTRY;
    const countrySubdivision = !isTorEnabled ? sellInfoCountrySubdivision : undefined;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);

    const defaultSubdivision = useMemo(
        () => getDefaultCountrySubdivision(countrySubdivision),
        [countrySubdivision],
    );

    const { address, token } = resolveAddressAndToken(account, defaultAsset?.contractAddress);

    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
        () => ({
            value: TRADING_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const defaultCurrency = useMemo(
        () => buildTradingFiatOption(getSupportedFiatCurrencyWithFallback(baseCurrencyCode)),
        [baseCurrencyCode],
    );
    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            currency: buildTradingBaseCurrencyOptionFromFiat(defaultCurrency.value),
            address,
            token,
        }),
        [defaultCurrency, address, token],
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
            sendCryptoSelect: defaultAsset,
            countrySelect: defaultCountry,
            countrySubdivisionSelect: defaultSubdivision,
            paymentMethod: defaultPaymentMethod,
            amountInCrypto: true,
        }),
        [defaultFormState, defaultAsset, defaultCountry, defaultPaymentMethod, defaultSubdivision],
    );

    return {
        defaultValues,
        defaultCountry,
        defaultSubdivision,
        defaultCurrency,
        defaultPaymentMethod,
    };
};
