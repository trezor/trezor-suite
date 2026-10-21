import { type NetworkSymbol, type StakingProviderId } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import {
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type StakeFormState,
    type StakeType,
    type StakingLimits,
} from '@suite-common/wallet-types';
import {
    calculateTotalGasCost,
    fromEther,
    fromGwei,
    fromWei,
    getAccountIdentity,
    getEthereumEstimateFeeParams,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { createEthereumStakingPositionReader } from './ethereumStakingLiveState';
import {
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
    findEthereumStakingAdapter,
} from './providers/ethereumStakingProviders';
import { type StakingOperationRequest, type StakingTxStep } from './providers/types';
import { type GetStakeFormsDefaultValuesParams } from './types';
import {
    calculateStakeFormTransaction,
    composeStakingTransaction,
} from '../shared/stakingFormUtils';

const LOG_PREFIX = 'composeEthereumStakingTransaction';

// TODO: get rid of generic error
const GENERIC_COMPOSE_ERROR: PrecomposedLevels = {
    normal: {
        error: 'INCORRECT-FEE-RATE',
        errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
        type: 'error',
    },
};

export const getEthereumStakeFormProviderId = ({
    providerId,
}: Pick<StakeFormState, 'providerId'>): StakingProviderId =>
    providerId ?? DEFAULT_ETHEREUM_STAKING_PROVIDER_ID;

export const getStakeFormsDefaultValues = ({
    address,
    stakeType,
    amount,
    providerId,
}: GetStakeFormsDefaultValuesParams) => ({
    fiatInput: '',
    cryptoInput: amount || '',
    outputs: [
        {
            ...DEFAULT_PAYMENT,
            address,
            amount: amount || '',
        },
    ],
    options: ['broadcast'],

    stakeType,
    ...(providerId ? { providerId } : {}),
    ethereumNonce: '',
    transactionData: '',

    estimatedFeeLimit: undefined,
    feeLimit: '',
    feePerUnit: '',
    selectedFee: undefined,

    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

export const addEthereumStakingGasReserve = (
    estimatedFeeLimit: string | undefined,
    gasReserve: number,
) =>
    new BigNumber(estimatedFeeLimit ?? '')
        .plus(gasReserve)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();

type EstimateEthereumStakingStepGasLimitParams = {
    step: StakingTxStep;
    from: string;
    symbol: NetworkSymbol;
    identity?: string;
};

// gasLimit calculation based on address, amount and data size
// amount is essential for a proper calculation of gasLimit (via blockbook/geth)
const estimateEthereumStakingStepGasLimit = async ({
    step,
    from,
    symbol,
    identity,
}: EstimateEthereumStakingStepGasLimitParams): Promise<
    { success: true; gasLimit: string } | { success: false; message: string }
> => {
    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: asCoinSymbol(symbol),
        identity,
        request: {
            blocks: [2],
            specific: {
                from,
                ...getEthereumEstimateFeeParams(
                    step.to,
                    fromWei(step.value).toEther(),
                    undefined,
                    step.data,
                ),
            },
        },
    });

    if (!estimatedFee.success) {
        return { success: false, message: estimatedFee.error.message };
    }

    const gasLimit = addEthereumStakingGasReserve(
        estimatedFee.payload.levels[0]?.feeLimit,
        step.gasReserve,
    );

    return { success: true, gasLimit: gasLimit.toString() };
};

const toStakingOperationRequest = (
    stakeType: StakeType,
    amount: string,
): StakingOperationRequest | null => {
    switch (stakeType) {
        case 'stake':
            return { type: 'stake', amount };
        case 'unstake':
            return { type: 'unstake', amount };
        case 'claim':
            return { type: 'claim' };
        case 'change-delegate':
            return null;
        default:
            return exhaustive(stakeType);
    }
};

const createEthereumStakeTransactionCalculator =
    (limits: StakingLimits) =>
    (
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
            minBalanceForStakingInBaseUnits: fromEther(
                limits.MIN_BALANCE_FOR_STAKING.toString(),
            ).toWei(),
            minAmountForStakingInBaseUnits: fromEther(
                limits.MIN_AMOUNT_FOR_STAKING.toString(),
            ).toWei(),
            minAmountForWithdrawalInBaseUnits: fromEther(
                limits.MIN_FOR_WITHDRAWALS.toString(),
            ).toWei(),
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
    providerId: StakingProviderId;
    source: string;
};

// Ethereum stake compose: plans the single step through the provider adapter, estimates gas with
// its calldata and carries the calldata on every fee level so the sign step verifies the same
// bytes instead of re-encoding them.
export const composeEthereumStakingTransaction = async ({
    formValues,
    composeContext,
    providerId,
    source,
}: ComposeEthereumStakingTransactionParams): Promise<PrecomposedLevels | undefined> => {
    const { account, feeInfo } = composeContext;
    const amount = formValues.outputs[0]?.amount;

    if (!amount || amount === '0') return undefined;
    if (!feeInfo) return undefined;

    const request = toStakingOperationRequest(formValues.stakeType, amount);

    if (!request) {
        console.error(`${LOG_PREFIX}: unsupported stake type ${formValues.stakeType}`);

        return GENERIC_COMPOSE_ERROR;
    }

    const adapter = findEthereumStakingAdapter(providerId);

    if (!adapter) {
        console.error(`${LOG_PREFIX}: no adapter for staking provider ${providerId}`);

        return GENERIC_COMPOSE_ERROR;
    }

    const identity = getAccountIdentity(account);

    const planned = await adapter.planOperation(request, {
        account,
        source,
        readPosition: createEthereumStakingPositionReader({ account, adapter, identity }),
    });

    if (!planned.success) {
        const { error } = planned;
        const detail = error.code === 'LIVE_STATE_INVALID' ? `: ${error.reason.code}` : '';
        console.error(`${LOG_PREFIX}: planning ${request.type} failed with ${error.code}${detail}`);

        return GENERIC_COMPOSE_ERROR;
    }

    const [step] = planned.plan.steps;

    if (!step) {
        console.error(`${LOG_PREFIX}: plan for ${request.type} has no step`);

        return GENERIC_COMPOSE_ERROR;
    }

    const estimate = await estimateEthereumStakingStepGasLimit({
        step,
        from: account.descriptor,
        symbol: account.symbol,
        identity,
    });

    if (!estimate.success) {
        console.error(`${LOG_PREFIX}: gas estimation for ${request.type} failed`);

        return GENERIC_COMPOSE_ERROR;
    }

    const customFeeLimit = estimate.gasLimit;

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
        createEthereumStakeTransactionCalculator(adapter.limits),
        undefined,
        customFeeLimit,
    );

    if (!composed) return undefined;

    return attachTransactionData(composed, step.data);
};
