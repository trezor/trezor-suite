import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type StakeFormState,
} from '@suite-common/wallet-types';
import {
    calculateTotalGasCost,
    fromEther,
    fromGwei,
    getAccountIdentity,
} from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';

import { getStakeTxGasLimit } from './ethereumStaking';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
} from './ethereumStakingConstants';
import {
    calculateStakeFormTransaction,
    composeStakingTransaction,
} from '../shared/stakingFormUtils';

const calculateEthereumStakeTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount: boolean,
    symbol: NetworkSymbol,
): PrecomposedTransaction => {
    const totalGasCostInWei = calculateTotalGasCost(
        fromGwei(feeLevel.maxFeePerGas || feeLevel.feePerUnit).toWei(),
        feeLevel.feeLimit,
    );

    const stakingParams = {
        feeInBaseUnits: totalGasCostInWei,
        minBalanceForStakingInBaseUnits: fromEther(MIN_ETH_BALANCE_FOR_STAKING.toString()).toWei(),
        minAmountForStakingInBaseUnits: fromEther(MIN_ETH_AMOUNT_FOR_STAKING.toString()).toWei(),
        minAmountForWithdrawalInBaseUnits: fromEther(MIN_ETH_FOR_WITHDRAWALS.toString()).toWei(),
    };

    return calculateStakeFormTransaction(
        availableBalance,
        output,
        feeLevel,
        compareWithAmount,
        symbol,
        stakingParams,
    );
};

const attachTransactionData = (
    composed: PrecomposedLevels,
    transactionData: string,
): PrecomposedLevels =>
    Object.fromEntries(
        Object.entries(composed).map(([label, transaction]) =>
            transaction.type === 'error'
                ? [label, transaction]
                : [label, { ...transaction, transactionData }],
        ),
    );

type ComposeEthereumStakingTransactionParams = {
    formValues: StakeFormState;
    composeContext: ComposeActionContext;
    source: string;
};

// Ethereum stake compose: builds the calldata once, estimates gas with it and carries it on every
// fee level so the sign step verifies the same bytes instead of re-encoding them.
export const composeEthereumStakingTransaction = async ({
    formValues,
    composeContext,
    source,
}: ComposeEthereumStakingTransactionParams): Promise<PrecomposedLevels | undefined> => {
    const { account, feeInfo } = composeContext;
    const amount = formValues.outputs[0]?.amount;

    if (!amount || amount === '0') return undefined;
    if (!feeInfo) return undefined;

    const stakeTx = await getStakeTxGasLimit({
        stakeType: formValues.stakeType,
        from: account.descriptor,
        amount,
        symbol: account.symbol,
        identity: getAccountIdentity(account),
        source,
    });

    if (!stakeTx.success) return stakeTx.error;

    const customFeeLimit = stakeTx.gasLimit;

    const predefinedLevels = feeInfo.levels
        .filter(level => level.label !== 'custom')
        .map(level => ({ ...level, feeLimit: customFeeLimit }));

    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            feeLimit: formValues.feeLimit,
            maxFeePerGas: formValues.maxFeePerGas,
            maxPriorityFeePerGas: formValues.maxPriorityFeePerGas || '0',
            blocks: -1,
        });
    }

    const composed = composeStakingTransaction(
        formValues,
        composeContext,
        predefinedLevels,
        calculateEthereumStakeTransaction,
        undefined,
        customFeeLimit,
    );

    if (!composed) return undefined;

    return attachTransactionData(composed, stakeTx.transactionData);
};
