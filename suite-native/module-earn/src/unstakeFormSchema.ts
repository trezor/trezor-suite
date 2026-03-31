import { yup } from '@suite-common/validators';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import { type Translate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

export type UnstakeFormContext = {
    stakedBalance?: string;
    decimals?: number;
    translate: Translate;
};

export const unstakeFormValidationSchema = yup.object({
    amount: yup
        .string()
        .required('Amount is required.')
        .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
        .test('is-zero', 'Amount must be greater than 0.', function (value) {
            if (!value) return true;

            const { translate } = this.options.context as UnstakeFormContext;

            if (new BigNumber(value).isZero()) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.amountIsZero'),
                });
            }

            return true;
        })
        .test('is-higher-than-staked', "You don't have enough staked balance.", function (value) {
            const { stakedBalance, translate } = this.options.context as UnstakeFormContext;

            if (!value || !stakedBalance) return true;

            if (new BigNumber(value).gt(stakedBalance)) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.insufficientBalance'),
                });
            }

            return true;
        })
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            const { decimals = 8, translate } = this.options.context as UnstakeFormContext;

            if (!isDecimalsValid(value, decimals)) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.tooManyDecimals'),
                });
            }

            return true;
        }),
    fiat: yup.string(),
});
