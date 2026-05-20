import { isAddressValid } from '@suite-common/address';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { yup } from '../config';

export type XpubFormContext = { symbol?: NetworkSymbol };

export const xpubFormValidationSchema = yup.object({
    xpubAddress: yup
        .string()
        .required()
        .test(
            'is-invalid-address',
            'Address is not valid',
            (value, { options: { context } }: yup.TestContext<XpubFormContext>) => {
                const symbol = context?.symbol;

                if (!symbol) return false;

                const networkType = getNetworkType(symbol);
                if (!isAddressBasedNetwork(networkType)) return true;

                return (
                    isNotNullOrUndefined(value) &&
                    isNotNullOrUndefined(symbol) &&
                    isAddressValid(value, symbol)
                );
            },
        ),
});
export type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;
