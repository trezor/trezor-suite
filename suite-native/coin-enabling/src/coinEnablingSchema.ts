import { yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export type CoinEnablingFormValues = {
    enabledCoins: NetworkSymbol[];
};

export const coinEnablingFormValidationSchema = yup.object({
    enabledCoins: yup.array().of(yup.string().required()).min(1),
});
