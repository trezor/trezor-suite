import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import {
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingBuyInfoSelector,
    type TradingCountryCode,
    type TradingPaymentMethodListProps,
    buildTradingFiatOption,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    getSupportedFiatCurrencyWithFallback,
    regional,
    selectTradingInfo,
    useTradingAssets,
} from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { type TradingBuyFormDefaultValuesProps } from 'src/types/trading/tradingForm';

export const useTradingBuyFormDefaultValues = (
    cryptoId: CryptoId | undefined,
    buyInfo: TradingBuyInfoSelector | undefined,
): TradingBuyFormDefaultValuesProps => {
    const { isTorEnabled } = useSelector(selectTorState);
    const { coins } = useSelector(selectTradingInfo);
    const { createAssetOptionFromCryptoId } = useTradingAssets();

    const country = !isTorEnabled
        ? (buyInfo?.buyInfo?.country as TradingCountryCode | undefined)
        : regional.UNKNOWN_COUNTRY;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);

    const defaultSubdivision = useMemo(
        () => getDefaultCountrySubdivision(buyInfo?.buyInfo?.subdivision),
        [buyInfo?.buyInfo?.subdivision],
    );

    const defaultCrypto = useMemo(() => {
        // coins is read via ref inside createAssetOptionFromCryptoId (stable callback);
        // referencing it here keeps the linter active while ensuring recompute after API load.
        void coins;

        return createAssetOptionFromCryptoId(cryptoId);
    }, [createAssetOptionFromCryptoId, cryptoId, coins]);

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
