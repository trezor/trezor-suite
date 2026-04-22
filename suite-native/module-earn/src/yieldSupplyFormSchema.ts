import { yup } from '@suite-common/validators';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import { type Translate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

export type YieldSupplyFormContext = {
    availableBalance?: string;
    decimals?: number;
    tokenSymbol: string;
    translate: Translate;
};

export const yieldSupplyFormValidationSchema = yup.object({
    amount: yup
        .string()
        .required('Amount is required.')
        .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
        .test('is-zero', 'Amount must be greater than 0.', function (value) {
            if (!value) return true;

            const { translate } = this.options.context as YieldSupplyFormContext;

            if (new BigNumber(value).isZero()) {
                return this.createError({
                    message: translate('earn.yieldSupplyFlowScreen.validation.amountIsZero'),
                });
            }

            return true;
        })
        .test('is-higher-than-balance', 'Amount exceeds balance.', function (value) {
            const { availableBalance, tokenSymbol, translate } = this.options
                .context as YieldSupplyFormContext;

            if (!value || !availableBalance) return true;

            if (new BigNumber(value).gt(availableBalance)) {
                return this.createError({
                    message: translate(
                        'earn.yieldSupplyFlowScreen.validation.insufficientBalance',
                        {
                            tokenSymbol,
                        },
                    ),
                });
            }

            return true;
        })
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            const { decimals = 0, translate } = this.options.context as YieldSupplyFormContext;

            if (!value) return true;

            if (!isDecimalsValid(value, decimals)) {
                return this.createError({
                    message: translate('earn.yieldSupplyFlowScreen.validation.tooManyDecimals'),
                });
            }

            return true;
        }),
});

export type YieldSupplyFormValues = yup.InferType<typeof yieldSupplyFormValidationSchema>;
