import { useMemo } from 'react';

import { CryptoId } from 'invity-api';

import {
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingBuyInfoSelector,
    TradingCountryCode,
    type TradingPaymentMethodListProps,
    buildTradingFiatOption,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    getSupportedFiatCurrencyWithFallback,
    regional,
    useTradingAssets,
} from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TradingBuyFormDefaultValuesProps } from 'src/types/trading/tradingForm';

export const useTradingBuyFormDefaultValues = (
    cryptoId: CryptoId | undefined,
    buyInfo: TradingBuyInfoSelector | undefined,
): TradingBuyFormDefaultValuesProps => {
    const { isTorEnabled } = useSelector(selectTorState);
    const { createAssetOptionFromCryptoId } = useTradingAssets();

    const country = !isTorEnabled
        ? (buyInfo?.buyInfo?.country as TradingCountryCode | undefined)
        : regional.UNKNOWN_COUNTRY;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);

    const defaultSubdivision = useMemo(
        () => getDefaultCountrySubdivision(buyInfo?.buyInfo?.subdivision),
        [buyInfo?.buyInfo?.subdivision],
    );

    const defaultCrypto = useMemo(
        () => createAssetOptionFromCryptoId(cryptoId),
        [createAssetOptionFromCryptoId, cryptoId],
    );
    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
        () => ({
            value: TRADING_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const suggestedFiatCurrency = getSupportedFiatCurrencyWithFallback(baseCurrencyCode);
    const defaultCurrency = useMemo(
        () => buildTradingFiatOption(suggestedFiatCurrency),
        [suggestedFiatCurrency],
    );
    const defaultValues = useMemo(
        () => ({
            fiatInput: undefined,
            cryptoInput: undefined,
            currencySelect: defaultCurrency,
            cryptoSelect: defaultCrypto,
            countrySelect: defaultCountry,
            countrySubdivisionSelect: defaultSubdivision,
            paymentMethod: defaultPaymentMethod,
            provider: undefined,
            amountInCrypto: false,
            receiveAddress: undefined,
        }),
        [defaultCountry, defaultCrypto, defaultCurrency, defaultPaymentMethod, defaultSubdivision],
    );

    return {
        defaultValues,
        defaultCountry,
        defaultSubdivision,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    };
};
