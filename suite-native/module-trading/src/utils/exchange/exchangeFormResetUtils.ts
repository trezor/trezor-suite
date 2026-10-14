import type { ExchangeFormType, ExchangeFormValues } from '@suite-native/trading-types';

export const resetExchangeForm = (
    { reset, getValues }: ExchangeFormType,
    defaultValues: Partial<ExchangeFormValues> = {},
) =>
    reset({
        sendAsset: getValues('sendAsset'),
        sendAccount: getValues('sendAccount'),
        receiveAsset: getValues('receiveAsset'),
        receiveAccount: getValues('receiveAccount'),
        ...defaultValues,
    });
