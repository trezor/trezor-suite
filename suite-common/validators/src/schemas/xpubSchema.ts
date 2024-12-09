import { G } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isAddressValid, isAddressBasedNetwork } from '@suite-common/wallet-utils';

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
                    G.isNotNullable(value) &&
                    G.isNotNullable(symbol) &&
                    isAddressValid(value, symbol)
                );
            },
        ),
});
export type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;
