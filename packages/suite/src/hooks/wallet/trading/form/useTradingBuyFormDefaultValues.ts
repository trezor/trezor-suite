import { useMemo } from 'react';

import { CryptoId, FiatCurrencyCode } from 'invity-api';

import {
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingBuyInfoSelector,
    TradingCountryCode,
    type TradingCountrySubdivisionOption,
    type TradingPaymentMethodListProps,
    enabledTradingCurrencies,
    getDefaultCountry,
    regional,
    selectTradingPrefilledFromAccount,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets, networks } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TradingBuyFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import { buildTradingFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo: TradingBuyInfoSelector | undefined,
): TradingBuyFormDefaultValuesProps => {
    const { isTorEnabled } = useSelector(selectTorState);
    const prefilledFromAccount = useSelector(selectTradingPrefilledFromAccount);
    const cryptoId = prefilledFromAccount.cryptoId ?? networks[accountSymbol]?.tradeCryptoId;
    const { createAssetOptionFromCryptoId } = useTradingAssets();

    const country = !isTorEnabled
        ? (buyInfo?.buyInfo?.country as TradingCountryCode | undefined)
        : regional.UNKNOWN_COUNTRY;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);

    /**
     * TODO: https://github.com/trezor/trezor-trade-api/issues/502
     * Implement default subdivision when it's implemented in the backend
     * */
    const defaultSubdivision: TradingCountrySubdivisionOption | undefined = undefined;

    // For testnet accounts, use default currency instead of casting to mainnet-only type
    const isTestnetAccount = !!networks[accountSymbol]?.testnet;
    const defaultNetworkSymbol: NetworkConfigWithoutTestnets['symbol'] = isTestnetAccount
        ? TRADING_DEFAULT_CRYPTO_CURRENCY
        : (accountSymbol as NetworkConfigWithoutTestnets['symbol']);

    const defaultCrypto = useMemo(
        () => createAssetOptionFromCryptoId(cryptoId as CryptoId | undefined, defaultNetworkSymbol),
        [createAssetOptionFromCryptoId, cryptoId, defaultNetworkSymbol],
    );
    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
        () => ({
            value: TRADING_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isEnabledTradingCurrency = isArrayMember(
        baseCurrencyCode,
        typedObjectValues(enabledTradingCurrencies),
    );
    const suggestedFiatCurrency = (
        isEnabledTradingCurrency ? baseCurrencyCode : 'usd'
    ) as FiatCurrencyCode;
    const defaultCurrency = useMemo(
        () => buildTradingFiatOption(isEnabledTradingCurrency ? baseCurrencyCode : 'usd'),
        [isEnabledTradingCurrency, baseCurrencyCode],
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
