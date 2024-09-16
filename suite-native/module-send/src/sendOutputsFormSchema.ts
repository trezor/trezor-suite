import { G } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount, isAddressValid } from '@suite-common/wallet-utils';
import { FeeInfo } from '@suite-common/wallet-types';
import { yup } from '@suite-common/validators';

export type SendFormFormContext = {
    networkSymbol?: NetworkSymbol;
    availableAccountBalance?: string;
    networkFeeInfo?: FeeInfo;
    isValueInSats?: boolean;
    normalFeeMaxAmount?: string;
};

const isAmountDust = (amount: string, context?: SendFormFormContext) => {
    if (!amount || !context) {
        return false;
    }

    const { networkSymbol, networkFeeInfo, isValueInSats } = context;

    if (!networkSymbol || !networkFeeInfo) {
        return false;
    }

    const amountBigNumber = new BigNumber(amount);
    const rawDust = networkFeeInfo.dustLimit?.toString();

    const dustThreshold =
        rawDust && (isValueInSats ? rawDust : formatNetworkAmount(rawDust, networkSymbol));

    if (!dustThreshold) {
        return false;
    }

    return amountBigNumber.lt(dustThreshold);
};

const isAmountHigherThanBalance = (amount: string, context?: SendFormFormContext) => {
    if (!amount || !context) {
        return false;
    }

    const {
        networkSymbol,
        networkFeeInfo,
        availableAccountBalance,
        normalFeeMaxAmount = '0',
    } = context;

    if (!networkSymbol || !networkFeeInfo || !availableAccountBalance) {
        return false;
    }

    const amountBigNumber = new BigNumber(amount);

    return amountBigNumber.gt(normalFeeMaxAmount);
};

// TODO: change error messages copy when is design ready
export const sendOutputsFormValidationSchema = yup.object({
    outputs: yup
        .array(
            yup.object({
                address: yup
                    .string()
                    .required()
                    .test(
                        'is-invalid-address',
                        'The address format is incorrect.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            const networkSymbol = context?.networkSymbol;

                            return (
                                G.isNotNullable(value) &&
                                G.isNotNullable(networkSymbol) &&
                                isAddressValid(value, networkSymbol)
                            );
                        },
                    ),
                amount: yup
                    .string()
                    .required('Amount is required.')
                    .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
                    .test(
                        'is-dust-amount',
                        'The value is lower than the dust limit.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            return !isAmountDust(value, context);
                        },
                    )
                    .test(
                        'is-higher-than-balance',
                        'You don’t have enough balance to send this amount.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            return !isAmountHigherThanBalance(value, context);
                        },
                    ),
                fiat: yup.string(),
                // TODO: other validations have to be added in the following PRs
                //       1) validation of token amount
                //       2) check if the amount is not higher than XRP reserve
            }),
        )
        .required(),
});

export type SendOutputsFormValues = yup.InferType<typeof sendOutputsFormValidationSchema>;
export type SendOutputFieldName = keyof SendOutputsFormValues['outputs'][number];
