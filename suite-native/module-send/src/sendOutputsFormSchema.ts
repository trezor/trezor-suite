import { G } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils';
import { getNetworkType, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    formatNetworkAmount,
    isAddressDeprecated,
    isAddressValid,
    isBech32AddressUppercase,
    isDecimalsValid,
    isTaprootAddress,
} from '@suite-common/wallet-utils';
import { FeeInfo } from '@suite-common/wallet-types';
import { yup } from '@suite-common/validators';
import { U_INT_32 } from '@suite-common/wallet-constants';

import { FeeLevelsMaxAmount } from './types';

export type SendFormFormContext = {
    symbol?: NetworkSymbol;
    availableBalance?: string;
    networkFeeInfo?: FeeInfo;
    isValueInSats?: boolean;
    isTokenFlow?: boolean;
    feeLevelsMaxAmount?: FeeLevelsMaxAmount;
    decimals?: number;
    accountDescriptor?: string;
    isTaprootAvailable?: boolean;
};

const isAmountDust = (amount: string, context?: SendFormFormContext) => {
    if (!amount || !context) {
        return false;
    }

    const { symbol, networkFeeInfo, isValueInSats } = context;

    if (!symbol || !networkFeeInfo) {
        return false;
    }

    const amountBigNumber = new BigNumber(amount);
    const rawDust = networkFeeInfo.dustLimit?.toString();

    const dustThreshold =
        rawDust && (isValueInSats ? rawDust : formatNetworkAmount(rawDust, symbol));

    if (!dustThreshold) {
        return false;
    }

    return amountBigNumber.lt(dustThreshold);
};

const isAmountHigherThanBalance = (
    amount: string,
    isSendMaxEnabled: boolean,
    context?: SendFormFormContext,
) => {
    if (!amount || !context) {
        return false;
    }

    const { symbol, networkFeeInfo, availableBalance, feeLevelsMaxAmount, isTokenFlow } = context;

    if (!symbol || !networkFeeInfo || !availableBalance) {
        return false;
    }

    const amountBigNumber = new BigNumber(amount);
    if (isTokenFlow) {
        return amountBigNumber.gt(availableBalance);
    }

    const normalMaxAmount = feeLevelsMaxAmount?.normal;

    // if send max is enabled, user is allowed submit form even if there is enough balance only for economy fee.
    if (isSendMaxEnabled) {
        const lowestLevelMaxAmount = feeLevelsMaxAmount?.economy ?? normalMaxAmount;
        if (!lowestLevelMaxAmount) return true;

        return amountBigNumber.gt(lowestLevelMaxAmount);
    }

    return !normalMaxAmount || amountBigNumber.gt(normalMaxAmount);
};

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
                            if (!value || !context) {
                                return false;
                            }
                            const { symbol, isTaprootAvailable } = context;

                            if (!symbol) return false;

                            const isTaprootValid =
                                isTaprootAvailable || !isTaprootAddress(value, symbol);

                            return (
                                isAddressValid(value, symbol) &&
                                !isAddressDeprecated(value, symbol) &&
                                !isBech32AddressUppercase(value) && // bech32 addresses are valid as uppercase but are not accepted by Trezor
                                isTaprootValid // bech32m/Taproot addresses are valid but may not be supported by older FW
                            );
                        },
                    )
                    .test(
                        'ripple-is-sending-to-self',
                        'Can`t send to myself.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            const { symbol, accountDescriptor } = context!;
                            if (!symbol || !accountDescriptor) return true;

                            if (getNetworkType(symbol) !== 'ripple') return true;

                            return value !== accountDescriptor;
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
                        'ripple-higher-than-reserve',
                        'Amount is above the required unspendable reserve (10 XRP)',
                        function (
                            value,
                            { options: { context } }: yup.TestContext<SendFormFormContext>,
                        ) {
                            const { symbol, availableBalance, feeLevelsMaxAmount } = context!;

                            if (!availableBalance || !symbol || getNetworkType(symbol) !== 'ripple')
                                return true;

                            const amountBigNumber = new BigNumber(value);

                            if (
                                feeLevelsMaxAmount?.normal &&
                                amountBigNumber.gt(
                                    formatNetworkAmount(
                                        // availableBalance = balance - reserve
                                        availableBalance,
                                        symbol,
                                    ),
                                )
                            ) {
                                return false;
                            }

                            return true;
                        },
                    )
                    .test(
                        'is-higher-than-balance',
                        'You don’t have enough balance to send this amount.',
                        function (
                            value,
                            { options: { context } }: yup.TestContext<SendFormFormContext>,
                        ) {
                            const isSendMaxEnabled = G.isNotNullable(
                                this.from?.[1]?.value.setMaxOutputId,
                            );

                            return !isAmountHigherThanBalance(value, isSendMaxEnabled, context);
                        },
                    )
                    .test(
                        'too-many-decimals',
                        'Too many decimals.',
                        (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                            const { decimals = 8 } = context!;

                            return isDecimalsValid(value, decimals);
                        },
                    ),
                fiat: yup.string(),
                token: yup.string().required().nullable(),
            }),
        )
        .required(),
    rippleDestinationTag: yup
        .string()
        .optional()
        .matches(/^\d*$/, 'You can only use positive numbers for the destination tag.')
        .test(
            'is-destination-tag-in-range',
            'Destination tag is too high.',
            (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                const { symbol } = context!;

                if (!symbol) return true;
                if (getNetworkType(symbol) !== 'ripple') return true;

                if (!value) return true;

                const numberValue = Number(value);

                if (numberValue > U_INT_32) {
                    return false;
                }

                return true;
            },
        ),
    setMaxOutputId: yup.number(),
});

export type SendOutputsFormValues = yup.InferType<typeof sendOutputsFormValidationSchema>;
export type SendOutputFieldName = keyof SendOutputsFormValues['outputs'][number];
export type SendFieldName = keyof SendOutputsFormValues | SendOutputFieldName;
