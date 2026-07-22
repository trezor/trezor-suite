import type { AddressValidator } from '@suite-common/address';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { yup } from '../config';

export type XpubFormContext = {
    addressValidator: AddressValidator;
    symbol?: NetworkSymbol;
};

export const xpubFormValidationSchema = yup.object({
    xpubAddress: yup
        .string()
        .required()
        .test('is-invalid-address', 'Address is not valid', (value, { options }) => {
            const context = options.context as XpubFormContext | undefined;
            const symbol = context?.symbol;

            if (!symbol || !context?.addressValidator) return false;

            const networkType = getNetworkType(symbol);
            if (!isAddressBasedNetwork(networkType)) return true;

            return (
                isNotNullOrUndefined(value) &&
                isNotNullOrUndefined(symbol) &&
                context.addressValidator.isAddressValid(value, symbol)
            );
        }),
});
export type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;
