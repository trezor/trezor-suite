import { formInputsMaxLength, yup } from '@suite-common/validators';
import { type NetworkSymbol, getDisplaySymbol, getNetworkType } from '@suite-common/wallet-config';
import { U_INT_32 } from '@suite-common/wallet-constants';
import { type FeeInfo, type Output } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    isAddressDeprecated,
    isAddressValid,
    isAmountWithinNetworkReserve,
    isBech32AddressUppercase,
    isDecimalsValid,
    isTaprootAddress,
} from '@suite-common/wallet-utils';
import { type FeeLevelsMaxAmount } from '@suite-native/transaction-management';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

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
    accountNativeAvailableBalance?: string;
    networkReserve?: string;
    rippleReserve?: string;
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

const hasEnoughBalanceForFees = (context?: SendFormFormContext) => {
    if (!context) {
        return false;
    }

    const { symbol, networkFeeInfo, accountNativeAvailableBalance, isTokenFlow } = context;

    if (!isTokenFlow) {
        return true;
    }
    if (!symbol || !networkFeeInfo || !accountNativeAvailableBalance) {
        return false;
    }

    const amountBigNumber = new BigNumber(accountNativeAvailableBalance);

    return amountBigNumber.gt(networkFeeInfo.minFee);
};

const outputSchema = yup.object({
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

                const isTaprootValid = isTaprootAvailable || !isTaprootAddress(value, symbol);

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
        )
        .test(
            'tron-is-sending-to-self',
            'Can`t send to myself.',
            (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                const { symbol, accountDescriptor, isTokenFlow } = context!;
                if (!symbol || !accountDescriptor) return true;

                if (getNetworkType(symbol) !== 'tron') return true;
                if (isTokenFlow) return true;

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
            (value, { options: { context } }: yup.TestContext<SendFormFormContext>) =>
                !isAmountDust(value, context),
        )
        .test(
            'ripple-higher-than-reserve',
            'Amount is above the required unspendable reserve',
            function (value, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                const { symbol, availableBalance, feeLevelsMaxAmount, rippleReserve } = context!;

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
                    const displaySymbol = getDisplaySymbol(symbol);

                    return this.createError({
                        message: `Amount is above the required unspendable reserve${rippleReserve ? ` (${rippleReserve} ${displaySymbol})` : ''}`,
                    });
                }

                return true;
            },
        )
        .test(
            'has-enough-balance-for-fees',
            `Insufficient balance to cover the transaction fees.`,
            function (_, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                return hasEnoughBalanceForFees(context);
            },
        )
        .test(
            'network-reserve',
            'Not enough funds remaining after reserving network fees',
            function (value, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                if (!value || !context) return true;

                const {
                    symbol,
                    availableBalance,
                    networkReserve,
                    isTokenFlow,
                    feeLevelsMaxAmount,
                } = context;

                if (!symbol || !availableBalance || !networkReserve || isTokenFlow) return true;

                const formattedBalance = formatNetworkAmount(availableBalance, symbol);
                if (new BigNumber(value).gt(formattedBalance)) return true;

                const isSendMaxEnabled = isNotNullOrUndefined(this.from?.[1]?.value.setMaxOutputId);
                const feeLevelMaxAmount = isSendMaxEnabled
                    ? feeLevelsMaxAmount?.economy
                    : feeLevelsMaxAmount?.normal;

                if (!feeLevelMaxAmount) return true;

                const feeWithReserve = new BigNumber(formattedBalance)
                    .minus(feeLevelMaxAmount)
                    .toString();

                return isAmountWithinNetworkReserve({
                    reserve: feeWithReserve,
                    balance: formattedBalance,
                    amount: value,
                });
            },
        )
        .test(
            'is-higher-than-balance',
            'You don’t have enough balance to send this amount.',
            function (value, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                const isSendMaxEnabled = isNotNullOrUndefined(this.from?.[1]?.value.setMaxOutputId);

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
    label: yup.string(),
});

export type OutputsFormValues = yup.InferType<typeof outputSchema>;

// Must correspond with `suite-common/wallet-types/src/transaction.ts:Output` type.
// This hacky code is here to somehow enforce it.
((_: Omit<Output, 'type' | 'currency' | 'fiat'> & { fiat?: string }) => {})(
    {} as unknown as OutputsFormValues,
);

export const sendOutputsFormValidationSchema = yup.object({
    outputs: yup.array(outputSchema).required(),
    transactionData: yup.string(),
    tronDataAscii: yup.string(),
    isDestinationTagEnabled: yup.boolean(),
    destinationTag: yup
        .string()
        .when('isDestinationTagEnabled', {
            is: true,
            then: schema => schema.required('Destination Tag is required'),
            otherwise: schema => schema.notRequired(),
        })
        .test(
            'is-destination-tag-a-number',
            'You can only use positive numbers for the destination tag.',
            (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                const { symbol } = context!;

                if (!symbol) return true;
                const networkType = getNetworkType(symbol);
                if (networkType === 'stellar' || networkType === 'solana') return true;

                if (!value) return true;

                if (!/^\d*$/.test(value)) return false;

                return true;
            },
        )
        .test(
            'is-destination-tag-required',
            'Destination tag was not set.',
            (
                value,
                {
                    options: { context },
                    schema: { isDestinationTagEnabled },
                }: yup.TestContext<SendFormFormContext>,
            ) => {
                const { symbol } = context!;

                if (!symbol) return true;
                const networkType = getNetworkType(symbol);
                if (
                    networkType !== 'ripple' &&
                    networkType !== 'stellar' &&
                    networkType !== 'solana'
                )
                    return true;

                // isDestinationTagEnabled is enabled, tag should be set
                if (!value && isDestinationTagEnabled) return false;

                return true;
            },
        )
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
        )
        .test(
            'is-destination-tag-length-valid',
            'Destination tag is too long.',
            (value, { options: { context } }: yup.TestContext<SendFormFormContext>) => {
                const { symbol } = context!;

                if (!symbol) return true;
                const networkType = getNetworkType(symbol);
                if (networkType !== 'stellar' && networkType !== 'solana') return true;

                if (!value) return true;

                const destinationTagMaxLength = (() => {
                    switch (networkType) {
                        case 'stellar':
                            return formInputsMaxLength.stellarTextMemo;
                        case 'solana':
                            return formInputsMaxLength.solanaMemo;
                        default:
                            throw new Error(`Unsupported network type: ${networkType}`);
                    }
                })();

                return value.length <= destinationTagMaxLength;
            },
        ),
    setMaxOutputId: yup.number(),
});

export type SendOutputsFormValues = yup.InferType<typeof sendOutputsFormValidationSchema>;
export type SendOutputFieldName = keyof SendOutputsFormValues['outputs'][number];
export type SendFieldName = keyof SendOutputsFormValues | SendOutputFieldName;
