import { useMemo } from 'react';

import { CryptoId, FiatCurrencyCode } from 'invity-api';

import {
    TRADING_DEFAULT_FIAT_CURRENCY,
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingBuyInfoSelector,
    type TradingPaymentMethodListProps,
    getDefaultCountry,
    regional,
    selectTradingPrefilledFromAccount,
    useTradingInfo,
} from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { TradingBuyFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import { buildFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo: TradingBuyInfoSelector | undefined,
): TradingBuyFormDefaultValuesProps => {
    const { isTorEnabled } = useSelector(selectTorState);
    const { buildDefaultCryptoOption } = useTradingInfo();
    const prefilledFromAccount = useSelector(selectTradingPrefilledFromAccount);
    const cryptoId = prefilledFromAccount.cryptoId ?? networks[accountSymbol]?.tradeCryptoId;

    const country = !isTorEnabled ? buyInfo?.buyInfo?.country : regional.UNKNOWN_COUNTRY;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultCrypto = useMemo(
        () => buildDefaultCryptoOption(cryptoId as CryptoId | undefined),
        [buildDefaultCryptoOption, cryptoId],
    );
    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
        () => ({
            value: TRADING_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );
    const suggestedFiatCurrency = (buyInfo?.buyInfo?.suggestedFiatCurrency?.toLowerCase() ??
        TRADING_DEFAULT_FIAT_CURRENCY) as FiatCurrencyCode;
    const defaultCurrency = useMemo(
        () => buildFiatOption(suggestedFiatCurrency),
        [suggestedFiatCurrency],
    );
    const defaultValues = useMemo(
        () => ({
            fiatInput: buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(suggestedFiatCurrency),
            cryptoInput: undefined,
            currencySelect: defaultCurrency,
            cryptoSelect: defaultCrypto,
            countrySelect: defaultCountry,
            paymentMethod: defaultPaymentMethod,
            amountInCrypto: false,
        }),
        [
            buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies,
            defaultCountry,
            defaultCrypto,
            defaultCurrency,
            defaultPaymentMethod,
            suggestedFiatCurrency,
        ],
    );

    return {
        defaultValues,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    };
};
