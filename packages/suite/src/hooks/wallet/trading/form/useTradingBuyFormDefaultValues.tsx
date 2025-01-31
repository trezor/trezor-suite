import { useMemo } from 'react';

import { CryptoId, FiatCurrencyCode } from 'invity-api';

import { type TradingPaymentMethodListProps, getDefaultCountry } from '@suite-common/trading';
import { networks } from '@suite-common/wallet-config';

import { BuyInfo } from 'src/actions/wallet/tradingBuyActions';
import {
    FORM_DEFAULT_FIAT_CURRENCY,
    FORM_DEFAULT_PAYMENT_METHOD,
} from 'src/constants/wallet/trading/form';
import { useSelector } from 'src/hooks/suite';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { TradingBuyFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import { buildFiatOption } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuyFormDefaultValues = (
    accountSymbol: Account['symbol'],
    buyInfo: BuyInfo | undefined,
): TradingBuyFormDefaultValuesProps => {
    const { buildDefaultCryptoOption } = useTradingInfo();
    const prefilledFromCryptoId = useSelector(state => state.wallet.trading.prefilledFromCryptoId);
    const cryptoId = prefilledFromCryptoId || networks[accountSymbol]?.tradeCryptoId;

    const country = buyInfo?.buyInfo?.country;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultCrypto = useMemo(
        () => buildDefaultCryptoOption(cryptoId as CryptoId | undefined),
        [buildDefaultCryptoOption, cryptoId],
    );
    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
        () => ({
            value: FORM_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );
    const suggestedFiatCurrency = (buyInfo?.buyInfo?.suggestedFiatCurrency?.toLowerCase() ??
        FORM_DEFAULT_FIAT_CURRENCY) as FiatCurrencyCode;
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
