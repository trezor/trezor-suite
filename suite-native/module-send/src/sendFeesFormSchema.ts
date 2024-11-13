import { yup } from '@suite-common/validators';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import { FeeInfo } from '@suite-common/wallet-types';
import { NetworkType } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

import { NativeSupportedFeeLevel } from './types';

type SendFeesFormContext = {
    networkType?: NetworkType;
    networkFeeInfo?: FeeInfo;
    minimalFeeLimit?: string;
};

const nativeSupportedFeeLevels: Array<NativeSupportedFeeLevel> = [
    'economy',
    'normal',
    'high',
    'custom',
];

export const sendFeesFormValidationSchema = yup.object({
    feeLevel: yup.string().oneOf(nativeSupportedFeeLevels).required('Fee level is required'),
    customFeePerUnit: yup
        .string()
        .required()
        .test(
            'too-many-decimals',
            'Too many decimals.',
            (value, { options: { context } }: yup.TestContext<SendFeesFormContext>) => {
                if (!value) return true;

                const { networkFeeInfo, networkType } = context!;
                if (!networkFeeInfo || !networkType) return false;

                if (networkType !== 'bitcoin' && networkType !== 'ethereum') return true;

                let maxDecimals = 0;
                if (networkType === 'bitcoin') {
                    maxDecimals = 2;
                } else if (networkType === 'ethereum') {
                    maxDecimals = 9;
                }

                return isDecimalsValid(value, maxDecimals);
            },
        )
        .test(
            'fee-too-low',
            'Fee is too low.',
            (value, { options: { context } }: yup.TestContext<SendFeesFormContext>) => {
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
            (value, { options: { context } }: yup.TestContext<SendFeesFormContext>) => {
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
            (value, { options: { context } }: yup.TestContext<SendFeesFormContext>) => {
                const { networkType, minimalFeeLimit } = context!;

                // Fee limit is used only for Ethereum, pass this validation for other networks.
                if (networkType !== 'ethereum') return true;

                if (!value || !minimalFeeLimit) return false;

                const feeBig = new BigNumber(value);

                return feeBig.gte(minimalFeeLimit);
            },
        ),
});

export type SendFeesFormValues = yup.InferType<typeof sendFeesFormValidationSchema>;
