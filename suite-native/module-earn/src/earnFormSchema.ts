import { yup } from '@suite-common/validators';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol, isDecimalsValid } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export type EarnFormContext = {
    symbol?: NetworkSymbol;
    availableBalance?: string;
    decimals?: number;
};

export const earnFormValidationSchema = yup.object({
    amount: yup
        .string()
        .required('Amount is required.')
        .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
        .test('is-zero', 'Amount must be greater than 0.', value => {
            if (!value) return true;

            return !new BigNumber(value).isZero();
        })
        .test(
            'is-higher-than-balance',
            "You don't have enough balance to stake this amount.",
            (value, { options: { context } }: yup.TestContext<EarnFormContext>) => {
                const { availableBalance } = context ?? {};

                if (!value || !availableBalance) return true;

                return !new BigNumber(value).gt(availableBalance);
            },
        )
        .test(
            'fee-buffer-reserve',
            'Not enough funds left after we reserve for withdrawal fees.',
            (value, { options: { context } }: yup.TestContext<EarnFormContext>) => {
                const { availableBalance, symbol } = context ?? {};

                if (!value || !availableBalance || !symbol) return true;

                const limits = getStakingLimitsByNetworkSymbol(symbol);
                if (!limits) return true;

                return !new BigNumber(value)
                    .plus(limits.MIN_BALANCE_FOR_FEE_BUFFER)
                    .gt(availableBalance);
            },
        )
        .test(
            'too-many-decimals',
            'Too many decimals.',
            (value, { options: { context } }: yup.TestContext<EarnFormContext>) => {
                const { decimals = 8 } = context ?? {};

                return isDecimalsValid(value, decimals);
            },
        ),
    fiat: yup.string(),
});

export type EarnFormValues = yup.InferType<typeof earnFormValidationSchema>;
