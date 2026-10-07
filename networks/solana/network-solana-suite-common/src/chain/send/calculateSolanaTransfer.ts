import type { TokenInfo } from '@trezor/blockchain-link-types';
import type { FeeLevel } from '@trezor/connect-common';
import {
    type ExternalOutput,
    type PrecomposedTransaction,
    calculateMax,
    calculateTotal,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    getMaxAmountWithReserve,
    isNetworkReserveApplicable,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

export type SolanaMaxReserve = {
    /** The account balance in units. */
    formattedBalance: string;
    isNetworkReserveEnabled: boolean;
    nativeTokenReserve: string | undefined;
};

/**
 * One SOL or SPL token transfer at a fee level. The account must keep at least the rent, unless it
 * sends everything.
 *
 * @param reserve What sending the maximum keeps back for later fees.
 */
export const calculateSolanaTransfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    decimals: number,
    rent: number,
    token: TokenInfo | undefined,
    reserve: SolanaMaxReserve,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerTx;
    if (feeInLamports == null) throw new Error('Invalid fee.');

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? convertAmountUnitsToSubunits(token.balance!, token.decimals)
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInLamports);

        const toUnits = (value: string) =>
            new BigNumber(value).div(new BigNumber(10).exponentiatedBy(decimals)).toString();

        max = getMaxAmountWithReserve({
            networkReserve: isNetworkReserveApplicable(
                token?.contract,
                reserve.isNetworkReserveEnabled,
            )
                ? reserve.nativeTokenReserve
                : undefined,
            balance: reserve.formattedBalance,
            amount: toUnits(max),
            fee: toUnits(feeInLamports),
        });

        max = new BigNumber(max)
            .multipliedBy(new BigNumber(10).exponentiatedBy(decimals))
            .toString();

        amount = max;
    } else {
        amount = output.amount;
    }

    // total SOL spent (amount + fee), in case of SPL token only the fee
    const totalSolSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInLamports));

    if (totalSolSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        // errorMessage declared later
        return { type: 'error', error, errorMessage: { id: error } } as const;
    }
    const remainingSolBalance = new BigNumber(availableBalance).minus(totalSolSpent);

    if (remainingSolBalance.isLessThan(rent) && remainingSolBalance.isGreaterThan(0)) {
        const errorMessage = {
            id: 'REMAINING_BALANCE_LESS_THAN_RENT' as const,
            values: {
                remainingSolBalance: convertAmountSubunitsToUnits(remainingSolBalance, decimals),
                rent: convertAmountSubunitsToUnits(rent, decimals),
            },
        };

        return { type: 'error', error: errorMessage.id, errorMessage } as const;
    }

    const payloadData: PrecomposedTransaction = {
        type: 'nonfinal',
        totalSpent: token ? amount : totalSolSpent.toString(),
        max,
        fee: feeInLamports,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        token,
        bytes: 0,
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from @trezor/connect
            inputs: [],
            outputsPermutation: [0],
            outputs: [
                {
                    address: output.address,
                    amount,
                    script_type: 'PAYTOADDRESS',
                },
            ],
        };
    }

    if (output.type === 'payment-noaddress') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [],
        };
    }

    return payloadData;
};
