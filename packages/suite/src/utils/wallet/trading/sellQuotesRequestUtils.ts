import { type TradingSellFormProps, isCountrySubdivisionEmpty } from '@suite-common/trading';

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

    const { amount } = output;

    return !!amount && parseFloat(amount) > 0;
};
