import type { BuyFormType, BuyFormValues } from '@suite-native/trading-types';

export const resetBuyForm = (
    { reset, getValues }: BuyFormType,
    defaultValues: Partial<BuyFormValues> = {},
) =>
    reset({
        asset: getValues('asset'),
        receiveAccount: getValues('receiveAccount'),
        fiatCurrency: getValues('fiatCurrency'),
        country: getValues('country'),
        countrySubdivision: getValues('countrySubdivision'),
        ...defaultValues,
    });
