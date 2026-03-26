import { yup } from '@suite-common/validators';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol, isDecimalsValid } from '@suite-common/wallet-utils';
import { type Translate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

export type EarnFormContext = {
    symbol?: NetworkSymbol;
    availableBalance?: string;
    decimals?: number;
    translate: Translate;
};

export const earnFormValidationSchema = yup.object({
    amount: yup
        .string()
        .required('Amount is required.')
        .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
        .test('min-amount', 'Amount is below minimum.', function (value) {
            const { symbol, translate } = this.options.context as EarnFormContext;

            if (!value || !symbol) return true;

            const limits = getStakingLimitsByNetworkSymbol(symbol);
            if (!limits) return true;

            if (new BigNumber(value).lt(limits.MIN_AMOUNT_FOR_STAKING)) {
                return this.createError({
                    message: translate('earn.earnFormScreen.validation.amountBelowMinimum', {
                        amount: limits.MIN_AMOUNT_FOR_STAKING.toString(),
                        symbol: getNetworkDisplaySymbol(symbol),
                    }),
                });
            }

            return true;
        })
        .test('is-zero', 'Amount must be greater than 0.', function (value) {
            if (!value) return true;

            const { translate } = this.options.context as EarnFormContext;

            if (new BigNumber(value).isZero()) {
                return this.createError({
                    message: translate('earn.earnFormScreen.validation.amountIsZero'),
                });
            }

            return true;
        })
        .test(
            'is-higher-than-balance',
            "You don't have enough balance to stake this amount.",
            function (value) {
                const { availableBalance, translate } = this.options.context as EarnFormContext;

                if (!value || !availableBalance) return true;

                if (new BigNumber(value).gt(availableBalance)) {
                    return this.createError({
                        message: translate('earn.earnFormScreen.validation.insufficientBalance'),
                    });
                }

                return true;
            },
        )
        .test(
            'fee-buffer-reserve',
            'Not enough funds left after we reserve for withdrawal fees.',
            function (value) {
                const { availableBalance, symbol, translate } = this.options
                    .context as EarnFormContext;

                if (!value || !availableBalance || !symbol) return true;

                const limits = getStakingLimitsByNetworkSymbol(symbol);
                if (!limits) return true;

                if (
                    new BigNumber(value)
                        .plus(limits.MIN_BALANCE_FOR_FEE_BUFFER)
                        .gt(availableBalance)
                ) {
                    return this.createError({
                        message: translate('earn.earnFormScreen.validation.feeBufferReserve'),
                    });
                }

                return true;
            },
        )
        .test('too-many-decimals', 'Too many decimals.', function (value) {
            const { decimals = 8, translate } = this.options.context as EarnFormContext;

            if (!isDecimalsValid(value, decimals)) {
                return this.createError({
                    message: translate('earn.earnFormScreen.validation.tooManyDecimals'),
                });
            }

            return true;
        }),
    fiat: yup.string(),
});

export type EarnFormValues = yup.InferType<typeof earnFormValidationSchema>;
