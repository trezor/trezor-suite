import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ComposeFeeLevelsParams,
    type PrecomposedLevels,
    convertAmountSubunitsToUnits,
    getExternalComposeOutput,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { calculateEvmTransfer } from './calculateEvmTransfer';
import {
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    ETH_TRANSFER_BACKUP_GAS_LIMIT,
    STAKE_GAS_LIMIT_RESERVE,
} from './evm/evmConstants';
import { isEvmApprovalTx } from './evm/evmHex';
import { getTxStakeNameByDataHex } from './evm/evmStaking';
import { getApprovalComposeOutput, getEthereumEstimateFeeParams } from './evm/evmTransaction';
import type { EvmSendAppDeps, EvmSendConfig } from './types';

export type ComposeEvmFeeLevelsDeps = GetTrezorConnectDep<'blockchainEstimateFee'> &
    Pick<
        EvmSendAppDeps,
        'isApprovalFlowSupported' | 'getEvmPrivatePendingHint' | 'onEvmFeeEstimationFailed'
    >;

export type ComposeEvmFeeLevelsParams = ComposeFeeLevelsParams & { config: EvmSendConfig };

export type ComposeEvmFeeLevels = (params: ComposeEvmFeeLevelsParams) => Promise<PrecomposedLevels>;

/**
 * EVM fee levels: the backend estimates the gas the draft needs, each level prices it. When the
 * estimate fails, a backup gas limit is used and the failure is reported to the app.
 */
export const createComposeEvmFeeLevels =
    (deps: ComposeEvmFeeLevelsDeps): ComposeEvmFeeLevels =>
    async ({ account, draft, context, config }) => {
        const { transactionData } = draft;
        const { feeInfo } = context;

        const isApproveTx = isEvmApprovalTx(transactionData);
        const { outputs } = draft;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof outputs)[number] = outputs[0];
        const contract = deps.isApprovalFlowSupported()
            ? (firstOutput.token ?? undefined)
            : firstOutput.address;

        if (isApproveTx && !contract) {
            throw new ChainSendError('compose-failed', account.symbol, 'Unable to compose output.');
        }

        const composedOutput = isApproveTx
            ? getApprovalComposeOutput(contract, account, config)
            : getExternalComposeOutput(draft, account, config);

        if (!composedOutput) {
            throw new ChainSendError('compose-failed', account.symbol, 'Unable to compose output.');
        }

        const { output, tokenInfo, decimals } = composedOutput;
        const { availableBalance } = account;
        const { amount } = firstOutput;
        // Use the resolved onchain address for a named input (e.g. ENS), otherwise the raw input.
        const address = firstOutput.resolvedAddress ?? firstOutput.address;

        const ethereumEstimateFeeParams =
            isApproveTx && contract
                ? getEthereumEstimateFeeParams(contract, '0', undefined, draft.transactionData)
                : getEthereumEstimateFeeParams(
                      address || account.descriptor,
                      amount || (tokenInfo ? tokenInfo.balance! : account.formattedBalance),
                      tokenInfo,
                      draft.transactionData,
                  );

        // trezor/blockbook#1639: declare our local pending txs so blockbook estimates gas against
        // the correct pending state. undefined for nothing pending — the field is omitted.
        const privatePending = deps.getEvmPrivatePendingHint(account);

        // gasLimit calculation based on address, amount and data size
        // amount in essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await deps.getTrezorConnect().blockchainEstimateFee({
            coin: toCoinSymbol(account.symbol),
            identity: account.deviceState,
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    ...ethereumEstimateFeeParams,
                    privatePending,
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

            deps.onEvmFeeEstimationFailed({
                account,
                draft,
                tokenInfo,
                estimateTarget: ethereumEstimateFeeParams.to,
                error: estimatedFee.error,
            });
        }

        // increase gas limit, this flow is used only for Invity
        if (draft.ethereumAdjustGasLimit) {
            customFeeLimit = customFeeLimit.multipliedBy(draft.ethereumAdjustGasLimit);
        }

        // increase gas limit for staking, this flow is used only during bump fee
        const isStakeEthTx = !!getTxStakeNameByDataHex(draft.transactionData);
        if (isStakeEthTx) {
            customFeeLimit = customFeeLimit.plus(STAKE_GAS_LIMIT_RESERVE);
        }

        // FeeLevels are read-only
        const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');
        // update predefined levels with customFeeLimit (gasLimit from data size or erc20 transfer)
        if (customFeeLimit.gt(0)) {
            predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit.toFixed(0)));
        }
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (draft.selectedFee === 'custom') {
            const { maxPriorityFeePerGas, maxFeePerGas, feePerUnit, feeLimit } = draft;

            predefinedLevels.push({
                label: 'custom',
                feePerUnit,
                feeLimit,
                maxPriorityFeePerGas,
                maxFeePerGas,
                blocks: -1,
            });
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculateEvmTransfer(availableBalance, output, level, tokenInfo, {
                decimals: config.decimals,
                formattedBalance: account.formattedBalance,
                isNetworkReserveEnabled: context.isNetworkReserveEnabled ?? false,
                nativeTokenReserve: config.nativeTokenReserve,
            }),
        );
        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label;
            resultLevels[feeLabel] = tx;
        });

        // format max
        // update errorMessage values (symbol)
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
                        networkDisplaySymbol: config.displaySymbol,
                        feeAmount: tx.errorMessage?.values?.feeAmount || '',
                    },
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                };
            }
        });

        return resultLevels;
    };
