import { G } from '@mobily/ts-belt';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isAddressValid, isAddressBasedNetwork } from '@suite-common/wallet-utils';

import { yup } from '../config';

export type XpubFormContext = { networkSymbol?: NetworkSymbol };

export const xpubFormValidationSchema = yup.object({
    xpubAddress: yup
        .string()
        .required()
        .test(
            'is-invalid-address',
            'Address is not valid',
            (value, { options: { context } }: yup.TestContext<XpubFormContext>) => {
                const networkSymbol = context?.networkSymbol;

                if (!networkSymbol) return false;

                const networkType = getNetworkType(networkSymbol);
                if (!isAddressBasedNetwork(networkType)) return true;

                return (
                    G.isNotNullable(value) &&
                    G.isNotNullable(networkSymbol) &&
                    isAddressValid(value, networkSymbol)
                );
            },
        ),
});
export type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;
