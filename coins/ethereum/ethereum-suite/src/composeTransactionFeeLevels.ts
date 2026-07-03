import type {
    AddToastDep,
    ComposeTransactionFeeLevels,
    GetIsApprovalFlowSupportedDep,
    PrecomposedLevels,
    PrecomposedTransaction,
} from '@network-module/suite-types';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    ETH_TRANSFER_BACKUP_GAS_LIMIT,
    STAKE_GAS_LIMIT_RESERVE,
} from '@suite-common/wallet-constants';
import { reportEthereumFeeEstimationFailed } from '@suite-common/wallet-core/src/send/reportEthereumFeeEstimationError';
import type {
    ComposeActionContext,
    ExternalOutput,
    FormState,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    calculateMax,
    calculateTotal,
    calculateTotalGasCost,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    fromGwei,
    fromWei,
    getAccountIdentity,
    getApprovalComposeOutput,
    getCryptoMaxAmountWithReserve,
    getEthereumEstimateFeeParams,
    getExternalComposeOutput,
    getTxStakeNameByDataHex,
    isEvmApprovalTx,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Ethereum compose dependencies are moved into the network module.
import TrezorConnect, { type FeeLevel, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export type CreateComposeEthereumTransactionFeeLevelsDeps = AddToastDep &
    GetIsApprovalFlowSupportedDep;

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
    composeContext?: ComposeActionContext,
    isNetworkReserveEnabled = false,
): PrecomposedTransaction => {
    let amount: string;
    let max: string | undefined;

    const totalGasCostInWei = calculateTotalGasCost(
        fromGwei(feeLevel.maxFeePerGas || feeLevel.feePerUnit).toWei(),
        feeLevel.feeLimit,
    );

    const availableTokenBalance = token
        ? convertAmountUnitsToSubunits(token.balance!, token.decimals)
        : undefined;

    const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';

    const consumesEntireFee =
        isSendMax && !token && feeLevel.label !== 'custom' && !!feeLevel.maxFeePerGas;

    if (isSendMax) {
        max = availableTokenBalance || calculateMax(availableBalance, totalGasCostInWei);

        if (composeContext) {
            const feesInUnits = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(totalGasCostInWei)),
                symbol: composeContext.account.symbol,
            }).toString();

            const maxInUnits = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(max)),
                symbol: composeContext.account.symbol,
            }).toString();

            max = getCryptoMaxAmountWithReserve({
                symbol: composeContext.account.symbol,
                contractAddress: token?.contract,
                balance: composeContext.account.formattedBalance,
                amount: maxInUnits,
                fee: feesInUnits,
                isNetworkReserveEnabled,
            });

            max = unitsToSubunits({
                value: asAmountUnit(new BigNumber(max)),
                symbol: composeContext.account.symbol,
            }).toString();
        }

        amount = max;
    } else {
        amount = output.amount;
    }

    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, totalGasCostInWei));

    if (totalSpent.isGreaterThan(availableBalance)) {
        if (token) {
            return {
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                errorMessage: {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                    values: {
                        feeAmount: fromWei(totalGasCostInWei).toEther(),
                    },
                },
            } as const;
        }

        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    if (
        availableTokenBalance &&
        (availableTokenBalance === '0' || new BigNumber(amount).gt(availableTokenBalance))
    ) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: token ? amount : totalSpent.toString(),
        max,
        fee: totalGasCostInWei,
        maxFeePerGas: feeLevel.maxFeePerGas,
        maxPriorityFeePerGas: consumesEntireFee
            ? feeLevel.maxFeePerGas
            : feeLevel.maxPriorityFeePerGas,
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

export const createComposeEthereumTransactionFeeLevels =
    (deps: CreateComposeEthereumTransactionFeeLevelsDeps): ComposeTransactionFeeLevels<string> =>
    async ({ formState, composeContext, isNetworkReserveEnabled = false }) => {
        const typedFormState = formState as FormState;
        const typedComposeContext = composeContext as ComposeActionContext;
        const { account, network, feeInfo } = typedComposeContext;
        const { transactionData } = typedFormState;

        const isApproveTx = isEvmApprovalTx(transactionData);
        const { outputs } = typedFormState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof outputs)[number] = outputs[0];
        const contract = deps.getIsApprovalFlowSupported()
            ? (firstOutput.token ?? undefined)
            : firstOutput.address;

        if (isApproveTx && !contract) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            };
        }

        const composedOutput = isApproveTx
            ? getApprovalComposeOutput(contract, account, network)
            : getExternalComposeOutput(typedFormState, account, network);

        if (!composedOutput) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            };
        }

        const { output, tokenInfo, decimals } = composedOutput;
        const { availableBalance } = account;
        const { address, amount } = firstOutput;

        const ethereumEstimateFeeParams =
            isApproveTx && contract
                ? getEthereumEstimateFeeParams(
                      contract,
                      '0',
                      undefined,
                      typedFormState.transactionData,
                  )
                : getEthereumEstimateFeeParams(
                      address || account.descriptor,
                      amount || (tokenInfo ? tokenInfo.balance! : account.formattedBalance),
                      tokenInfo,
                      typedFormState.transactionData,
                  );

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            identity: getAccountIdentity(account),
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    ...ethereumEstimateFeeParams,
                },
            },
        });

        let customFeeLimit: BigNumber;

        if (estimatedFee.success) {
            const { levels } = estimatedFee.payload;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstLevel: (typeof levels)[number] = levels[0];
            customFeeLimit = new BigNumber(firstLevel.feeLimit || '');
        } else {
            customFeeLimit = new BigNumber(
                tokenInfo || transactionData
                    ? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT
                    : ETH_TRANSFER_BACKUP_GAS_LIMIT,
            );

            reportEthereumFeeEstimationFailed({
                account,
                formState: typedFormState,
                tokenInfo,
                estimateTarget: ethereumEstimateFeeParams.to,
                error: estimatedFee.error,
            });

            deps.addToast({
                type: 'estimated-fee-error',
            });
        }

        if (typedFormState.ethereumAdjustGasLimit) {
            customFeeLimit = customFeeLimit.multipliedBy(typedFormState.ethereumAdjustGasLimit);
        }

        const isStakeEthTx = !!getTxStakeNameByDataHex(typedFormState.transactionData);

        if (isStakeEthTx) {
            customFeeLimit = customFeeLimit.plus(STAKE_GAS_LIMIT_RESERVE);
        }

        const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');

        if (customFeeLimit.gt(0)) {
            predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit.toFixed(0)));
        }

        if (typedFormState.selectedFee === 'custom') {
            const { maxPriorityFeePerGas, maxFeePerGas, feePerUnit, feeLimit } = typedFormState;

            predefinedLevels.push({
                label: 'custom',
                feePerUnit,
                feeLimit,
                maxPriorityFeePerGas,
                maxFeePerGas,
                blocks: -1,
            });
        }

        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(
                availableBalance,
                output,
                level,
                tokenInfo,
                typedComposeContext,
                isNetworkReserveEnabled,
            ),
        );

        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        Object.keys(resultLevels).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tx: (typeof resultLevels)[string] = resultLevels[key];

            if (tx.type !== 'error') {
                tx.max = tx.max ? convertAmountSubunitsToUnits(tx.max, decimals) : undefined;
                tx.estimatedFeeLimit = !customFeeLimit.isNaN()
                    ? customFeeLimit.toFixed(0)
                    : undefined;
            }

            if (
                tx.type === 'error' &&
                tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT'
            ) {
                tx.errorMessage = {
                    values: {
                        networkDisplaySymbol: getNetworkDisplaySymbol(network.symbol),
                        feeAmount: tx.errorMessage?.values?.feeAmount || '',
                    },
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                };
            }
        });

        return resultLevels;
    };
