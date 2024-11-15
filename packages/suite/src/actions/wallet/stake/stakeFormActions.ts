import { BigNumber } from '@trezor/utils/src/bigNumber';
import { FeeLevel } from '@trezor/connect';
import {
    calculateTotal,
    calculateMax,
    getExternalComposeOutput,
    formatAmount,
} from '@suite-common/wallet-utils';
import {
    StakeFormState,
    PrecomposedLevels,
    PrecomposedTransaction,
    ExternalOutput,
} from '@suite-common/wallet-types';
import { ComposeActionContext } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';

type StakingParams = {
    feeInBaseUnits: string;
    minBalanceForStakingInBaseUnits: string;
    minAmountForStakingInBaseUnits: string;
    minAmountForWithdrawalInBaseUnits: string;
};

export const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
    stakingParams: StakingParams,
): PrecomposedTransaction => {
    const {
        feeInBaseUnits,
        minBalanceForStakingInBaseUnits,
        minAmountForStakingInBaseUnits,
        minAmountForWithdrawalInBaseUnits,
    } = stakingParams;

    let amount: string;
    let max: string | undefined;

    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        const minAmountWithFeeInBaseUnits = new BigNumber(minBalanceForStakingInBaseUnits).plus(
            feeInBaseUnits,
        );

        if (new BigNumber(availableBalance).lt(minAmountWithFeeInBaseUnits)) {
            max = minAmountForStakingInBaseUnits;
        } else {
            max = new BigNumber(calculateMax(availableBalance, feeInBaseUnits))
                .minus(minAmountForWithdrawalInBaseUnits)
                .toString();
        }

        amount = max;
    } else {
        amount = output.amount;
    }

    const totalSpent = new BigNumber(calculateTotal(amount, feeInBaseUnits));

    if (
        new BigNumber(feeInBaseUnits).gt(availableBalance) ||
        (compareWithAmount && totalSpent.isGreaterThan(availableBalance))
    ) {
        const error = 'TR_STAKE_NOT_ENOUGH_FUNDS';

        // errorMessage declared later
        return {
            type: 'error',
            error,
            errorMessage: { id: error, values: { symbol: symbol.toUpperCase() } },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: totalSpent.toString(),
        max,
        fee: feeInBaseUnits,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
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

    return payloadData;
};

export const composeStakingTransaction = (
    formValues: StakeFormState,
    formState: ComposeActionContext,
    predefinedLevels: FeeLevel[],
    calculateTransaction: (
        availableBalance: string,
        output: ExternalOutput,
        feeLevel: FeeLevel,
        compareWithAmount: boolean,
        symbol: NetworkSymbol,
    ) => PrecomposedTransaction,
    customFeeLimit?: string,
) => {
    const { account, network } = formState;
    const composeOutputs = getExternalComposeOutput(formValues, account, network);
    if (!composeOutputs) return; // no valid Output

    const { output, decimals } = composeOutputs;
    const { availableBalance } = account;

    // wrap response into PrecomposedLevels object where key is a FeeLevel label
    const wrappedResponse: PrecomposedLevels = {};
    const compareWithAmount = formValues.ethereumStakeType === 'stake';
    const response = predefinedLevels.map(level =>
        calculateTransaction(availableBalance, output, level, compareWithAmount, account.symbol),
    );
    response.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    // format max (calculate sends it as satoshi)
    // update errorMessage values (symbol)
    Object.keys(wrappedResponse).forEach(key => {
        const tx = wrappedResponse[key];
        if (tx.type !== 'error') {
            tx.max = tx.max ? formatAmount(tx.max, decimals) : undefined;
            tx.estimatedFeeLimit = customFeeLimit ?? tx.estimatedFeeLimit;
        }
        if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
            tx.errorMessage = {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: { symbol: network.symbol.toUpperCase() },
            };
        }
    });

    return wrappedResponse;
};
