import type { TokenInfo } from '@trezor/blockchain-link-types';
import type { FeeLevel } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

import type { ChainSendDraft } from './ChainSend';
import type {
    ExternalOutput,
    FeeInfo,
    PrecomposedLevels,
    PrecomposedTransaction,
} from './PrecomposedTransaction';
import {
    calculateMax,
    calculateTotal,
    convertAmountSubunitsToUnits,
    formatCoinAmount,
} from './composeHelpers';

/** The fee levels to compose: the network's levels, plus the user's own when they chose it. */
export const getRequestedFeeLevels = (feeInfo: FeeInfo, draft: ChainSendDraft): FeeLevel[] => {
    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (draft.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: draft.feePerUnit,
            blocks: -1,
        });
    }

    return predefinedLevels;
};

/**
 * One transfer on an account-based network with a flat fee per transaction (Ripple, Stellar).
 *
 * @param requiredAmount The least a recipient that does not exist yet must receive (its reserve).
 * @param token Only when sending a token: the coin then pays the fee alone.
 * @param resourceFee Soroban only; `feePerByte` stays the inclusion fee the transaction is built with.
 */
export const calculateAccountTransfer = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    requiredAmount?: BigNumber,
    token?: TokenInfo,
    resourceFee?: string,
): PrecomposedTransaction => {
    const feeInSatoshi = new BigNumber(feeLevel.feePerUnit).plus(resourceFee ?? 0).toFixed();

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? new BigNumber(token.balance!).shiftedBy(token.decimals).toString()
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInSatoshi);
        amount = max;
    } else {
        amount = output.amount;
    }

    // Total native asset amount to be sent.
    // If sending a token, we only need to calculate the fee.
    const totalNativeSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInSatoshi));

    if (totalNativeSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        return {
            type: 'error',
            error,
            errorMessage: { id: error },
        } as const;
    }

    if (requiredAmount?.gt(amount)) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            // errorMessage declared later
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: token ? amount : totalNativeSpent.toString(),
        max,
        token,
        fee: feeInSatoshi,
        feePerByte: feeLevel.feePerUnit,
        bytes: 0, // TODO: calculate
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

    return payloadData;
};

export type ComposeAccountTransferLevelsParams = {
    availableBalance: string;
    output: ExternalOutput;
    feeInfo: FeeInfo;

    /** The levels to price, as `getRequestedFeeLevels` returned them or repriced. */
    composeLevels: FeeLevel[];
    requiredAmount?: BigNumber;
    token?: TokenInfo;
    resourceFee?: string;

    /**
     * Whether a lower fee may rescue a transfer no level can pay. Not for a fee whose larger part
     * the ladder cannot lower (Soroban's resource fee).
     */
    canLowerFee: boolean;

    /** Decimals of what is sent, for the max amount. */
    decimals: number;

    /** Decimals of the network's coin, for the reserve. */
    coinDecimals: number;

    /** The coin as the user sees it, in error messages. */
    displaySymbol: string;
};

/** Every fee level of an account-based transfer, with what the user needs to fix any of them. */
export const composeAccountTransferLevels = ({
    availableBalance,
    output,
    feeInfo,
    composeLevels,
    requiredAmount,
    token,
    resourceFee,
    canLowerFee,
    decimals,
    coinDecimals,
    displaySymbol,
}: ComposeAccountTransferLevelsParams): PrecomposedLevels => {
    // wrap response into PrecomposedLevels object where key is a FeeLevel label
    const resultLevels: PrecomposedLevels = {};
    const response = composeLevels.map(level =>
        calculateAccountTransfer(
            availableBalance,
            output,
            level,
            requiredAmount,
            token,
            resourceFee,
        ),
    );
    response.forEach((tx, index) => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const composeLevel: (typeof composeLevels)[number] = composeLevels[index];
        const feeLabel = composeLevel.label;
        resultLevels[feeLabel] = tx;
    });

    const hasAtLeastOneValid = response.find(r => r.type !== 'error');
    // there is no valid tx in predefinedLevels and there is no custom level.
    if (!hasAtLeastOneValid && !resultLevels.custom && canLowerFee) {
        const { minFee } = feeInfo;
        const lastIndex = composeLevels.length - 1;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const lastLevel: (typeof composeLevels)[number] = composeLevels[lastIndex];
        const lastKnownFee = lastLevel.feePerUnit;
        let maxFee = new BigNumber(lastKnownFee).minus(1);
        // generate custom levels in range from lastKnownFee -1 to feeInfo.minFee (coinInfo in @trezor/connect)
        const customLevels: FeeLevel[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
            maxFee = maxFee.minus(1);
        }

        const customLevelsResponse = customLevels.map(level =>
            calculateAccountTransfer(
                availableBalance,
                output,
                level,
                requiredAmount,
                token,
                resourceFee,
            ),
        );

        const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const customResult: (typeof customLevelsResponse)[number] =
                customLevelsResponse[customValid];
            resultLevels.custom = customResult;
        }
    }

    // format max (calculate sends it in the base units of whatever is being sent)
    // update errorMessage values (reserve)
    Object.keys(resultLevels).forEach(key => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const tx: (typeof resultLevels)[string] = resultLevels[key];
        if (tx.type !== 'error' && tx.max) {
            tx.max = convertAmountSubunitsToUnits(tx.max, decimals);
        }
        if (tx.type === 'error' && tx.error === 'AMOUNT_IS_LESS_THAN_RESERVE' && requiredAmount) {
            tx.errorMessage = {
                id: 'AMOUNT_IS_LESS_THAN_RESERVE',
                values: {
                    reserve: formatCoinAmount(requiredAmount.toString(), coinDecimals),
                    displaySymbol,
                },
            };
        }
        if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
            tx.errorMessage = {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: {
                    networkDisplaySymbol: displaySymbol,
                },
            };
        }
    });

    return resultLevels;
};
