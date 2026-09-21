import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_FIAT,
    type TradingSellFormProps,
    isCountrySubdivisionEmpty,
} from '@suite-common/trading';

export const getSellActiveAmountField = (
    values: TradingSellFormProps,
): typeof TRADING_FORM_OUTPUT_AMOUNT | typeof TRADING_FORM_OUTPUT_FIAT =>
    values.amountInCrypto ? TRADING_FORM_OUTPUT_AMOUNT : TRADING_FORM_OUTPUT_FIAT;

export const getSellActiveAmount = (values: TradingSellFormProps): string | undefined => {
    const output = values.outputs?.[0];

    return values.amountInCrypto ? output?.amount : output?.fiat;
};

export const isSellQuotesFetchAllowed = (values: TradingSellFormProps): boolean => {
    const output = values.outputs?.[0];

    if (!values.sendCryptoSelect || !values.countrySelect || !output?.currency?.value) {
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

    const amount = getSellActiveAmount(values);

    return !!amount && parseFloat(amount) > 0;
};
