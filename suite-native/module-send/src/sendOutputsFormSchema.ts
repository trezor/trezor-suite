import { isAddressDeprecated, isBech32AddressUppercase } from '@suite-common/address';
import { type AddressValidator, type NamedAddressSupport } from '@suite-common/networks';
import { formInputsMaxLength, yup } from '@suite-common/validators';
import { type NetworkSymbol, getDisplaySymbol, getNetworkType } from '@suite-common/wallet-config';
import { U_INT_32 } from '@suite-common/wallet-constants';
import { type FeeInfo, type FeesStatus, type Output } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    isAmountWithinNetworkReserve,
    isDecimalsValid,
} from '@suite-common/wallet-utils';
import { type FeeLevelsMaxAmount } from '@suite-native/transaction-management';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

export type SendFormFormContext = {
    addressValidator?: AddressValidator;
    symbol?: NetworkSymbol;
    availableBalanceBeforeFees?: string;
    networkFeeInfo?: FeeInfo;
    isValueInSats?: boolean;
    isTokenFlow?: boolean;
    feeAdjustedMaxSendAmountByLevel?: FeeLevelsMaxAmount;
    networkFeeStatus?: FeesStatus;
    decimals?: number;
    accountDescriptor?: string;
    nativeCurrencyBalanceAvailableForFees?: string;
    networkReserve?: string;
    rippleReserve?: string;
    /** What the recipient network can do with names, owned by its network module. */
    namedAddress?: NamedAddressSupport;
};

const isAmountDust = (enteredAmount: string, context?: SendFormFormContext) => {
    if (!enteredAmount || !context) {
        return false;
    }

    const { symbol, networkFeeInfo, isValueInSats } = context;

    if (!symbol || !networkFeeInfo) {
        return false;
    }

    const enteredAmountValue = new BigNumber(enteredAmount);
    const rawDust = networkFeeInfo.dustLimit?.toString();

    const dustThreshold =
        rawDust && (isValueInSats ? rawDust : formatNetworkAmount(rawDust, symbol));

    if (!dustThreshold) {
        return false;
    }

    return enteredAmountValue.lt(dustThreshold);
};

type BalanceValidationResult = 'valid' | 'insufficient-balance' | 'fee-information-unavailable';

const getSendAmountBalanceValidationResult = (
    enteredAmount: string,
    isSendMaxSelected: boolean,
    context?: SendFormFormContext,
): BalanceValidationResult => {
    if (!enteredAmount || !context) {
        return 'valid';
    }

    const {
        symbol,
        availableBalanceBeforeFees,
        feeAdjustedMaxSendAmountByLevel,
        networkFeeStatus,
        isTokenFlow,
        isValueInSats,
    } = context;

    if (!symbol || !availableBalanceBeforeFees) {
        return 'valid';
    }

    const enteredAmountValue = new BigNumber(enteredAmount);
    const availableBalanceBeforeFeesInFormUnits =
        isTokenFlow || isValueInSats
            ? availableBalanceBeforeFees
            : formatNetworkAmount(availableBalanceBeforeFees, symbol);

    if (enteredAmountValue.gt(availableBalanceBeforeFeesInFormUnits)) {
        return 'insufficient-balance';
    }

    if (isTokenFlow) return 'valid';

    const normalFeeAdjustedMaxSendAmount = feeAdjustedMaxSendAmountByLevel?.normal;

    // Send Max may proceed when only the economy fee leaves enough balance.
    const feeAdjustedMaxSendAmount = isSendMaxSelected
        ? (feeAdjustedMaxSendAmountByLevel?.economy ?? normalFeeAdjustedMaxSendAmount)
        : normalFeeAdjustedMaxSendAmount;

    if (!feeAdjustedMaxSendAmount) {
        return networkFeeStatus === 'error' ? 'fee-information-unavailable' : 'valid';
    }

    return enteredAmountValue.gt(feeAdjustedMaxSendAmount) ? 'insufficient-balance' : 'valid';
};

const getNativeFeeBalanceValidationResult = (
    context?: SendFormFormContext,
): BalanceValidationResult => {
    if (!context) {
        return 'valid';
    }

    const {
        symbol,
        networkFeeInfo,
        networkFeeStatus,
        nativeCurrencyBalanceAvailableForFees,
        isTokenFlow,
    } = context;

    if (!isTokenFlow) {
        return 'valid';
    }
    if (networkFeeStatus === 'error') {
        return 'fee-information-unavailable';
    }
    if (!symbol || !networkFeeInfo || !nativeCurrencyBalanceAvailableForFees) {
        return 'valid';
    }

    const nativeCurrencyBalance = new BigNumber(nativeCurrencyBalanceAvailableForFees);

    return nativeCurrencyBalance.gt(networkFeeInfo.minFee) ? 'valid' : 'insufficient-balance';
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
                const { addressValidator, symbol, namedAddress } = context;

                if (!addressValidator || !symbol) return false;

                // A named input (e.g. ENS) is not an address, so the format check would always
                // fail it. `is-name-resolved` gates it on the address it resolved to instead.
                if (namedAddress?.isSupported && namedAddress.isNameLike(value)) {
                    return true;
                }

                return (
                    addressValidator.isAddressValid(value, symbol) &&
                    !isAddressDeprecated({ addressValidator, address: value, symbol }) &&
                    !isBech32AddressUppercase(value) // bech32 addresses are valid as uppercase but are not accepted by Trezor
                );
            },
        )
        .test(
            'is-name-resolved',
            'Could not resolve name. Check that the name is correct.',
            function (value, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                const { addressValidator, symbol, namedAddress } = context ?? {};

                if (!value || !addressValidator || !symbol) return true;
                if (!namedAddress?.isSupported) return true;
                if (!namedAddress.isNameLike(value)) return true;

                const { resolvedAddress } = this.parent as { resolvedAddress?: string };

                // `undefined` means the resolution has not settled yet, so there is nothing to
                // fail on. Submission is blocked meanwhile by the send screen, not here — erroring
                // while a name is still resolving would flash on every keystroke.
                if (resolvedAddress === undefined) return true;

                return addressValidator.isAddressValid(resolvedAddress, symbol);
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
                const {
                    symbol,
                    availableBalanceBeforeFees,
                    feeAdjustedMaxSendAmountByLevel,
                    rippleReserve,
                } = context!;

                if (!availableBalanceBeforeFees || !symbol || getNetworkType(symbol) !== 'ripple')
                    return true;

                const enteredAmountValue = new BigNumber(value);

                if (
                    feeAdjustedMaxSendAmountByLevel?.normal &&
                    enteredAmountValue.gt(
                        formatNetworkAmount(
                            // The available balance already excludes the Ripple reserve.
                            availableBalanceBeforeFees,
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
                const validationResult = getNativeFeeBalanceValidationResult(context);

                if (validationResult === 'fee-information-unavailable') {
                    return this.createError({
                        message: 'Network fee information is unavailable.',
                    });
                }

                return validationResult !== 'insufficient-balance';
            },
        )
        .test(
            'network-reserve',
            'Not enough funds remaining after reserving network fees',
            function (value, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                if (!value || !context) return true;

                const {
                    symbol,
                    availableBalanceBeforeFees,
                    networkReserve,
                    isTokenFlow,
                    feeAdjustedMaxSendAmountByLevel,
                } = context;

                if (!symbol || !availableBalanceBeforeFees || !networkReserve || isTokenFlow)
                    return true;

                const availableBalanceBeforeFeesInFormUnits = formatNetworkAmount(
                    availableBalanceBeforeFees,
                    symbol,
                );
                if (new BigNumber(value).gt(availableBalanceBeforeFeesInFormUnits)) return true;

                const isSendMaxSelected = isNotNullOrUndefined(
                    this.from?.[1]?.value.setMaxOutputId,
                );
                const feeAdjustedMaxSendAmount = isSendMaxSelected
                    ? feeAdjustedMaxSendAmountByLevel?.economy
                    : feeAdjustedMaxSendAmountByLevel?.normal;

                if (!feeAdjustedMaxSendAmount) return true;

                const feeAndReserveAmount = new BigNumber(availableBalanceBeforeFeesInFormUnits)
                    .minus(feeAdjustedMaxSendAmount)
                    .toString();

                return isAmountWithinNetworkReserve({
                    reserve: feeAndReserveAmount,
                    balance: availableBalanceBeforeFeesInFormUnits,
                    amount: value,
                });
            },
        )
        .test(
            'is-higher-than-balance',
            'You don’t have enough balance to send this amount.',
            function (value, { options: { context } }: yup.TestContext<SendFormFormContext>) {
                const isSendMaxSelected = isNotNullOrUndefined(
                    this.from?.[1]?.value.setMaxOutputId,
                );
                const validationResult = getSendAmountBalanceValidationResult(
                    value,
                    isSendMaxSelected,
                    context,
                );

                if (validationResult === 'fee-information-unavailable') {
                    return this.createError({
                        message: 'Network fee information is unavailable.',
                    });
                }

                return validationResult !== 'insufficient-balance';
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
    // Onchain address a named input resolved to. Written by `useResolvedAddress`, read by the
    // `is-name-resolved` test above and by composing/signing through the send form draft.
    resolvedAddress: yup.string(),
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
                if (['solana', 'stellar', 'tron'].includes(networkType)) return true;

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
