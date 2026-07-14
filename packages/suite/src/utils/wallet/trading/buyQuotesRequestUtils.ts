import { type TradingBuyFormProps, isCountrySubdivisionEmpty } from '@suite-common/trading';

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

    const amount = values.fiatInput || values.cryptoInput;

    return !!amount && parseFloat(amount) > 0;
};
