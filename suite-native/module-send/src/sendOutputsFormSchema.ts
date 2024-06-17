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
};

const isAmountDust = ({
    value,
    networkSymbol,
    isValueInSats,
    networkFeeInfo,
}: {
    value: string;
    networkSymbol: NetworkSymbol;
    isValueInSats: boolean;
    networkFeeInfo: FeeInfo;
}) => {
    const valueBigNumber = new BigNumber(value);
    const rawDust = networkFeeInfo.dustLimit?.toString();

    const dustThreshold =
        rawDust && (isValueInSats ? rawDust : formatNetworkAmount(rawDust, networkSymbol));

    if (!dustThreshold) {
        return false;
    }

    return valueBigNumber.lt(dustThreshold);
};

const isAmountHigherThanBalance = ({
    value,
    networkSymbol,
    isValueInSats,
    availableAccountBalance,
}: {
    value: string;
    networkSymbol: NetworkSymbol;
    isValueInSats: boolean;
    availableAccountBalance: string;
}) => {
    const formattedAvailableBalance = isValueInSats
        ? availableAccountBalance
        : formatNetworkAmount(availableAccountBalance, networkSymbol);

    const valueBig = new BigNumber(value);

    return valueBig.gt(formattedAvailableBalance);
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
                        'Address is not valid.',
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
                    .required()
                    .matches(/^\d*\.?\d+$/, 'Invalid decimal value.')
                    .test(
                        'is-dust-amount',
                        'The value is lower than dust threshold.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            if (!context || !value) return false;
                            const { networkSymbol, networkFeeInfo } = context;

                            if (!networkSymbol || !networkFeeInfo) return false;

                            return !isAmountDust({
                                value,
                                networkSymbol,
                                isValueInSats: false,
                                networkFeeInfo,
                            });
                        },
                    )
                    .test(
                        'is-higher-than-balance',
                        'Amount is higher than available balance.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            if (!context || !value) return false;
                            const { networkSymbol, networkFeeInfo, availableAccountBalance } =
                                context;

                            if (!networkSymbol || !networkFeeInfo || !availableAccountBalance)
                                return false;

                            return !isAmountHigherThanBalance({
                                value,
                                networkSymbol,
                                isValueInSats: false,
                                availableAccountBalance,
                            });
                        },
                    ),
                // TODO: other validations have to be added in the following PRs
                //       1) validation of token amount
                //       2) check if the amount is not higher than XRP reserve
            }),
        )
        .required(),
});

export type SendOutputsFormValues = yup.InferType<typeof sendOutputsFormValidationSchema>;
