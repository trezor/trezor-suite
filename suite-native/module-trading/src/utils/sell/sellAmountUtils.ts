import type { SellFormType } from '@suite-native/trading-types';

type SellFormAmountSetters = Pick<SellFormType, 'getValues' | 'setValue'>;

// The other amounts are filled from quotes requested by the crypto amount.
export const syncSellAmountsAfterCryptoChange = ({
    getValues,
    setValue,
}: SellFormAmountSetters) => {
    setValue('fiatStringAmount', undefined, { shouldValidate: true });
    setValue('cryptoBaseCurrencyStringAmount', undefined);

    if (!getValues('amountInCrypto')) {
        setValue('amountInCrypto', true);
    }
};

// The crypto amount is filled from quotes requested by the fiat amount.
export const syncSellAmountsAfterFiatChange = ({ getValues, setValue }: SellFormAmountSetters) => {
    setValue('cryptoStringAmount', undefined, { shouldValidate: true });
    setValue('cryptoBaseCurrencyStringAmount', undefined);

    if (getValues('amountInCrypto')) {
        setValue('amountInCrypto', false);
    }
};

export const setSellCryptoAmount = (
    form: SellFormAmountSetters,
    cryptoAmount: string | undefined,
) => {
    form.setValue('cryptoStringAmount', cryptoAmount, { shouldValidate: true });
    syncSellAmountsAfterCryptoChange(form);
};
