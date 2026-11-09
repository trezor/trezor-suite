import type { ExchangeFormType } from '@suite-native/trading-types';

export const setExchangeSendCryptoAmount = (
    setValue: ExchangeFormType['setValue'],
    cryptoAmount: string | undefined,
) => {
    setValue('sendCryptoAmount', cryptoAmount, { shouldValidate: true });
    setValue('sendBaseCurrencyAmount', undefined);
};
