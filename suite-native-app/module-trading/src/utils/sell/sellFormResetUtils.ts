import type { SellFormType, SellFormValues } from '@suite-native/trading-types';

export const resetSellForm = (
    { reset, getValues }: SellFormType,
    defaultValues: Partial<SellFormValues> = {},
) =>
    reset({
        sendAsset: getValues('sendAsset'),
        sendAccount: getValues('sendAccount'),
        fiatCurrency: getValues('fiatCurrency'),
        country: getValues('country'),
        countrySubdivision: getValues('countrySubdivision'),
        ...defaultValues,
    });
