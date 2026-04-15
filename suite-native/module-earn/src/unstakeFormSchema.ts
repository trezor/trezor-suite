import { yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol, isDecimalsValid } from '@suite-common/wallet-utils';
import { type Translate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

export type UnstakeFormContext = {
    symbol?: NetworkSymbol;
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
        .test('max-amount', 'Amount exceeds maximum.', function (value) {
            const { symbol, translate } = this.options.context as UnstakeFormContext;

            if (!value || !symbol) return true;

            const limits = getStakingLimitsByNetworkSymbol(symbol);
            if (!limits) return true;

            if (new BigNumber(value).gt(limits.MAX_AMOUNT_FOR_STAKING)) {
                return this.createError({
                    message: translate('earn.unstakeFormScreen.validation.amountExceedsMax', {
                        maxAmount: limits.MAX_AMOUNT_FOR_STAKING.toString(),
                    }),
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
