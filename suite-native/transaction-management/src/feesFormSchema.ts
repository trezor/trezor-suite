import { yup } from '@suite-common/validators';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type FeeInfo, type FeeLevelLabel } from '@suite-common/wallet-types';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import type { UseFormReturn } from '@suite-native/forms';
import { type Translate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { getFeeDecimals } from './utils';

export type FeesFormContext = {
    symbol?: NetworkSymbol;
    networkFeeInfo?: FeeInfo;
    minimalFeeLimit?: string;
    translate?: Translate;
    isEip1559Fee: boolean;
};

const FeeLevelLabels: Array<FeeLevelLabel> = ['economy', 'low', 'normal', 'high', 'custom'];

const validateFeeDecimalLength = (value: string | undefined, context: Partial<FeesFormContext>) => {
    if (!value) return true;

    const { networkFeeInfo, symbol } = context!;

    if (!symbol) return false;

    const { networkType } = getNetwork(symbol);

    if (!networkFeeInfo || !networkType) return false;

    const maxDecimals = getFeeDecimals({ symbol });

    if (maxDecimals === null) return true;

    return isDecimalsValid(value, maxDecimals);
};

export const feesFormValidationSchema = yup.object({
    feeLevel: yup.string().oneOf(FeeLevelLabels).required('Fee level is required'),
    customFeePerUnit: yup
        .string()
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            const { translate, isEip1559Fee, ...context } = this.options.context as FeesFormContext;
            if (!value || isEip1559Fee) return true;
            if (!validateFeeDecimalLength(value, context)) {
                return this.createError({
                    message: translate!(
                        'transactionManagement.fees.custom.bottomSheet.errors.decimals',
                    ),
                });
            }

            return true;
        })
        .test('fee-too-low', 'Fee is too low.', function (value) {
            const { networkFeeInfo, translate, isEip1559Fee } = this.options
                .context as FeesFormContext;
            if (!value || isEip1559Fee) return true;

            if (!networkFeeInfo) return false;
            const { minFee } = networkFeeInfo;
            const feeBig = new BigNumber(value);

            if (feeBig.isLessThan(minFee)) {
                return this.createError({
                    message: translate!(
                        'transactionManagement.fees.custom.bottomSheet.errors.feePerUnit.low',
                    ),
                });
            }

            return true;
        })
        .test('fee-too-high', 'Fee is too high.', function (value) {
            const { networkFeeInfo, translate, isEip1559Fee } = this.options
                .context as FeesFormContext;
            if (!value || isEip1559Fee) return true;

            if (!networkFeeInfo) return false;

            const feeBig = new BigNumber(value);
            const { maxFee } = networkFeeInfo;

            if (feeBig.gt(maxFee)) {
                return this.createError({
                    message: translate!(
                        'transactionManagement.fees.custom.bottomSheet.errors.feePerUnit.high',
                    ),
                });
            }

            return true;
        })
        .required(),
    customFeeLimit: yup.string().test(
        'fee-limit-too-low',
        'Value is too low.',

        function (value) {
            if (!value) return true;
            const { symbol, minimalFeeLimit, translate } = this.options.context as FeesFormContext;

            if (!symbol) return true;

            const { networkType } = getNetwork(symbol);

            if (networkType !== 'ethereum' && networkType !== 'tron') return true;

            if (!value || !minimalFeeLimit) return false;

            const feeBig = new BigNumber(value);

            if (feeBig.isLessThan(minimalFeeLimit)) {
                return this.createError({
                    message:
                        networkType === 'tron'
                            ? translate!(
                                  'transactionManagement.fees.tron.feeLimitBelowRecommended',
                                  { minFeeLimit: minimalFeeLimit },
                              )
                            : translate!(
                                  'transactionManagement.fees.custom.bottomSheet.errors.feeLimit.low',
                                  { minGasLimit: minimalFeeLimit },
                              ),
                });
            }

            return true;
        },
    ),
    // EIP1559 only validations
    customMaxFeePerGas: yup
        .string()
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            if (!value) return true;

            const { translate, ...context } = this.options.context as FeesFormContext;
            if (!validateFeeDecimalLength(value, context)) {
                return this.createError({
                    message: translate!(
                        'transactionManagement.fees.custom.bottomSheet.errors.decimals',
                    ),
                });
            }

            return true;
        })
        .test('max-fee-per-gas-range', 'Max fee per gas is out of range.', function (value) {
            if (!value) return true;

            const { translate, networkFeeInfo, symbol } = this.options.context as FeesFormContext;

            if (!networkFeeInfo || !symbol) return false;

            const { maxFee, minFee } = networkFeeInfo;
            const feeBig = new BigNumber(value);

            if (feeBig.isGreaterThan(maxFee) || feeBig.isLessThan(minFee)) {
                return this.createError({
                    message: translate!(
                        'transactionManagement.fees.custom.bottomSheet.errors.maxFeePerGas.outOfRange',
                        {
                            minFee,
                            maxFee,
                        },
                    ),
                });
            }

            return true;
        })
        .test(
            'custom-max-fee-per-gas-higher-than-priority',
            'Max fee must be higher than priority fee.',
            function (value) {
                if (!value) return true;

                const { customMaxPriorityFeePerGas } = this.parent;

                if (!customMaxPriorityFeePerGas) return true;

                const { translate } = this.options.context as FeesFormContext;
                const feeBig = new BigNumber(value);

                if (feeBig.isLessThan(customMaxPriorityFeePerGas)) {
                    return this.createError({
                        message: translate!(
                            'transactionManagement.fees.custom.bottomSheet.errors.maxFeePerGas.lessThanPriority',
                        ),
                    });
                }

                return true;
            },
        ),
    customMaxPriorityFeePerGas: yup
        .string()
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            const { translate, ...context } = this.options.context as FeesFormContext;
            if (!validateFeeDecimalLength(value, context)) {
                return this.createError({
                    message: translate!(
                        'transactionManagement.fees.custom.bottomSheet.errors.decimals',
                    ),
                });
            }

            return true;
        })
        .test(
            'custom-priority-fee-per-gas',
            'Priority fee higher than max fee or below minimum.',
            function (value) {
                if (!value) return true;
                const { networkFeeInfo, translate } = this.options.context as FeesFormContext;

                if (!networkFeeInfo) return false;
                const { minPriorityFee } = networkFeeInfo;
                const feeBig = new BigNumber(value);

                if (feeBig.isLessThan(minPriorityFee)) {
                    return this.createError({
                        message: translate!(
                            'transactionManagement.fees.custom.bottomSheet.errors.maxPriorityFee.min',
                            { minPriorityFee },
                        ),
                    });
                }

                const { customMaxFeePerGas } = this.parent;

                if (customMaxFeePerGas && feeBig.isGreaterThan(customMaxFeePerGas)) {
                    return this.createError({
                        message: translate!(
                            'transactionManagement.fees.custom.bottomSheet.errors.maxPriorityFee.higherThanMaxFee',
                        ),
                    });
                }

                return true;
            },
        ),
});

export type FeesFormValues = yup.InferType<typeof feesFormValidationSchema>;

export type FeesFormType = UseFormReturn<FeesFormValues>;
