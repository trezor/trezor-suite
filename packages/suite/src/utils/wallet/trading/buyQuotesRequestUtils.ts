import {
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    type TradingBuyFormProps,
    isCountrySubdivisionEmpty,
} from '@suite-common/trading';

export const getBuyActiveAmountField = (
    values: TradingBuyFormProps,
): typeof TRADING_FORM_CRYPTO_INPUT | typeof TRADING_FORM_FIAT_INPUT =>
    values.amountInCrypto ? TRADING_FORM_CRYPTO_INPUT : TRADING_FORM_FIAT_INPUT;

export const getBuyActiveAmount = (values: TradingBuyFormProps): string | undefined =>
    values.amountInCrypto ? values.cryptoInput : values.fiatInput;

export const isBuyQuotesFetchAllowed = (values: TradingBuyFormProps): boolean => {
    if (!values.cryptoSelect || !values.countrySelect || !values.currencySelect) {
        return false;
    }

    if (
        isCountrySubdivisionEmpty(
            values.countrySelect.value,
            values.countrySubdivisionSelect?.value,
        )
    ) {
        return false;
    }

    const amount = getBuyActiveAmount(values);

    return !!amount && parseFloat(amount) > 0;
};
