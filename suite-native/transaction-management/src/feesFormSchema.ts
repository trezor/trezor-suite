import { yup } from '@suite-common/validators';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { FeeInfo } from '@suite-common/wallet-types';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import type { UseFormReturn } from '@suite-native/forms';
import { BigNumber } from '@trezor/utils';

import { NativeSupportedFeeLevel } from './types';
import { getFeeDecimals } from './utils';

export type FeesFormContext = {
    symbol?: NetworkSymbol;
    networkFeeInfo?: FeeInfo;
    minimalFeeLimit?: string;
};

const nativeSupportedFeeLevels: Array<NativeSupportedFeeLevel> = [
    'economy',
    'normal',
    'high',
    'custom',
];

export const feesFormValidationSchema = yup.object({
    feeLevel: yup.string().oneOf(nativeSupportedFeeLevels).required('Fee level is required'),
    customFeePerUnit: yup
        .string()
        .required()
        .test(
            'too-many-decimals',
            'Too many decimals.',
            (value, { options: { context } }: yup.TestContext<FeesFormContext>) => {
                if (!value) return true;

                const { networkFeeInfo, symbol } = context!;

                if (!symbol) return false;

                const { networkType } = getNetwork(symbol);

                if (!networkFeeInfo || !networkType) return false;

                const maxDecimals = getFeeDecimals({ symbol });

                if (maxDecimals === null) return true;

                return isDecimalsValid(value, maxDecimals);
            },
        )
        .test(
            'fee-too-low',
            'Fee is too low.',
            (value, { options: { context } }: yup.TestContext<FeesFormContext>) => {
                if (!value) return true;
                const { networkFeeInfo } = context!;

                if (!networkFeeInfo) return false;
                const { minFee } = networkFeeInfo;

                return Number(value) >= minFee;
            },
        )
        .test(
            'fee-too-high',
            'Fee is too high.',
            (value, { options: { context } }: yup.TestContext<FeesFormContext>) => {
                if (!value) return true;

                const { networkFeeInfo } = context!;

                if (!value || !networkFeeInfo) return false;

                const feeBig = new BigNumber(value);
                const { maxFee } = networkFeeInfo;

                return feeBig.lte(maxFee);
            },
        ),
    customFeeLimit: yup
        .string()
        .test(
            'fee-limit-too-low',
            'Value is too low.',
            (value, { options: { context } }: yup.TestContext<FeesFormContext>) => {
                const { symbol, minimalFeeLimit } = context!;
                if (!symbol) return true;

                const { networkType } = getNetwork(symbol);

                // Fee limit is used only for Ethereum, pass this validation for other networks.
                if (networkType !== 'ethereum') return true;

                if (!value || !minimalFeeLimit) return false;

                const feeBig = new BigNumber(value);

                return feeBig.gte(minimalFeeLimit);
            },
        ),
});

export type FeesFormValues = yup.InferType<typeof feesFormValidationSchema>;

export type FeesFormType = UseFormReturn<FeesFormValues>;
