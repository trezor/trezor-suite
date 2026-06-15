import { fromWei, toWei } from 'web3-utils';

import { isApprovalFlowSupported, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    ETH_SPEED_UP_TX_MULTIPLIER,
    ETH_TRANSFER_BACKUP_GAS_LIMIT,
    STAKE_GAS_LIMIT_RESERVE,
} from '@suite-common/wallet-constants';
import {
    type Account,
    AddressDisplayOptions,
    type ComposeActionContext,
    type ExternalOutput,
    type FeeInfo,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type RbfTransactionParams,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    calculateMax,
    calculateTotal,
    calculateTotalGasCost,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getApprovalComposeOutput,
    getCryptoMaxAmountWithReserve,
    getEthereumEstimateFeeParams,
    getEvmNonceInfo,
    getExternalComposeOutput,
    getTxStakeNameByDataHex,
    isEip1559,
    isEvmApprovalTx,
    prepareEthereumTransaction,
    subunitsToUnits,
    tryGetAccountIdentity,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import { selectAddressDisplayType } from '../settings/walletSettingsReducer';
import { selectTransactions } from '../transactions/transactionsSelectors';

/**
 * Returns fee info with levels bumped above the original transaction's gas price,
 * so that the replacement transaction will be accepted by the mempool.
 *
 * Expects `feeInfo` with levels already in Gwei (i.e. from selectConvertedNetworkFeeInfo).
 * `originalGasParams` must also be in Gwei.
 */
export const getEthereumRbfFeeInfo = (
    feeInfo: FeeInfo,
    originalGasParams: { gasPrice?: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string },
): FeeInfo => {
    // feeInfo.levels are already in Gwei — do NOT call getConvertedOrDefaultFeeInfo here,
    // that would double-convert and produce near-zero values.
    const { levels } = feeInfo;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstLevel: (typeof levels)[number] = levels[0];
    if (!firstLevel) return feeInfo;

    if (isEip1559(originalGasParams) && isEip1559(firstLevel)) {
        const currentMaxFee = new BigNumber(originalGasParams.maxFeePerGas);
        // Cast back to access maxPriorityFeePerGas — isEip1559 narrows to { maxFeePerGas: string } only
        const currentMaxPriorityFee = new BigNumber(
            (originalGasParams as { maxPriorityFeePerGas?: string }).maxPriorityFeePerGas || '0',
        );
        const highLevel = levels.find(l => l.label === 'high') ?? firstLevel;

        const newMaxFeePerGas = BigNumber.maximum(currentMaxFee, highLevel.maxFeePerGas ?? 0)
            .multipliedBy(ETH_SPEED_UP_TX_MULTIPLIER)
            .toString();
        const newMaxPriorityFeePerGas = BigNumber.maximum(
            currentMaxPriorityFee,
            highLevel.maxPriorityFeePerGas ?? 0,
        )
            .multipliedBy(ETH_SPEED_UP_TX_MULTIPLIER)
            .toString();

        return {
            ...feeInfo,
            levels: [
                {
                    ...highLevel,
                    label: 'normal' as const,
                    maxFeePerGas: newMaxFeePerGas,
                    maxPriorityFeePerGas: newMaxPriorityFeePerGas,
                },
            ],
        };
    }

    const currentGasPrice = new BigNumber(
        originalGasParams.gasPrice || originalGasParams.maxFeePerGas || '0',
    );
    const minFeeFromNetwork = new BigNumber(firstLevel.feePerUnit);
    const fee = BigNumber.maximum(minFeeFromNetwork, currentGasPrice.plus(feeInfo.minFee));

    return {
        ...feeInfo,
        levels: feeInfo.levels.map(level => ({
            ...level,
            feePerUnit: fee.toString(),
        })),
        minFee: currentGasPrice.plus(feeInfo.minFee).toNumber(),
    };
};

export const calculate = (
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
        toWei(feeLevel.maxFeePerGas || feeLevel.feePerUnit, 'gwei'),
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

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, totalGasCostInWei));

    if (totalSpent.isGreaterThan(availableBalance)) {
        if (token) {
            return {
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                errorMessage: {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                    values: {
                        feeAmount: fromWei(totalGasCostInWei, 'ether').toString(),
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

    // validate if token balance is not 0 or lower than amount
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

export const composeEthereumTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeEthereumTransactionFeeLevelsThunk`,
    async (
        { formState, composeContext, isNetworkReserveEnabled = false },
        { dispatch, rejectWithValue, getState },
    ) => {
        const device = selectSelectedDevice(getState());

        const { account, network, feeInfo } = composeContext;
        const { transactionData } = formState;

        // If a custom nonce targets an existing pending tx (a replacement made outside the RBF
        // flow), bump the fee to the RBF threshold so the node accepts it instead of rejecting it
        // as "replacement transaction underpriced". RBF (speed-up / cancel) flows already pass a
        // pre-bumped feeInfo, so they're skipped here.
        const customNonce = formState.ethereumNonce?.trim();
        const replacedPendingTx =
            customNonce && !formState.rbfParams && account.networkType === 'ethereum'
                ? (selectTransactions(getState())[account.key] ?? [])
                      .filter(isPending)
                      .filter(isSentTransaction)
                      .find(tx => tx.ethereumSpecific?.nonce === Number(customNonce))
                : undefined;
        const replacedGas = replacedPendingTx?.ethereumSpecific;
        const effectiveFeeInfo = replacedGas
            ? getEthereumRbfFeeInfo(feeInfo, {
                  gasPrice: replacedGas.gasPrice ? fromWei(replacedGas.gasPrice, 'gwei') : undefined,
                  maxFeePerGas: replacedGas.maxFeePerGas
                      ? fromWei(replacedGas.maxFeePerGas, 'gwei')
                      : undefined,
                  maxPriorityFeePerGas: replacedGas.maxPriorityFeePerGas
                      ? fromWei(replacedGas.maxPriorityFeePerGas, 'gwei')
                      : undefined,
              })
            : feeInfo;

        const isApproveTx = isEvmApprovalTx(transactionData);
        const { outputs } = formState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof outputs)[number] = outputs[0];
        const contract = isApprovalFlowSupported(device)
            ? (firstOutput.token ?? undefined)
            : firstOutput.address;

        if (isApproveTx && !contract) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });
        }

        const composedOutput = isApproveTx
            ? getApprovalComposeOutput(contract, account, network)
            : getExternalComposeOutput(formState, account, network);

        if (!composedOutput)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });

        const { output, tokenInfo, decimals } = composedOutput;
        const { availableBalance } = account;
        const { address, amount } = firstOutput;

        const ethereumEstimateFeeParams =
            isApproveTx && contract
                ? getEthereumEstimateFeeParams(contract, '0', undefined, formState.transactionData)
                : getEthereumEstimateFeeParams(
                      address || account.descriptor,
                      amount || (tokenInfo ? tokenInfo.balance! : account.formattedBalance),
                      tokenInfo,
                      formState.transactionData,
                  );

        // gasLimit calculation based on address, amount and data size
        // amount in essential for a proper calculation of gasLimit (via blockbook/geth)
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
            dispatch(
                notificationsActions.addToast({
                    type: 'estimated-fee-error',
                }),
            );
        }

        // increase gas limit, this flow is used only for Invity
        if (formState.ethereumAdjustGasLimit) {
            customFeeLimit = customFeeLimit.multipliedBy(formState.ethereumAdjustGasLimit);
        }

        // increase gas limit for staking, this flow is used only during bump fee
        const isStakeEthTx = !!getTxStakeNameByDataHex(formState.transactionData);
        if (isStakeEthTx) {
            customFeeLimit = customFeeLimit.plus(STAKE_GAS_LIMIT_RESERVE);
        }

        // FeeLevels are read-only
        const levels = customFeeLimit
            ? effectiveFeeInfo.levels.map(l => ({ ...l }))
            : effectiveFeeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');
        // update predefined levels with customFeeLimit (gasLimit from data size or erc20 transfer)
        if (customFeeLimit.gt(0)) {
            predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit.toFixed(0)));
        }
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formState.selectedFee === 'custom') {
            const { maxPriorityFeePerGas, maxFeePerGas, feePerUnit, feeLimit } = formState;

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
            calculate(
                availableBalance,
                output,
                level,
                tokenInfo,
                composeContext,
                isNetworkReserveEnabled,
            ),
        );
        response.forEach((tx, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const predefinedLevel: (typeof predefinedLevels)[number] = predefinedLevels[index];
            const feeLabel = predefinedLevel.label as FeeLevel['label'];
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
                        networkDisplaySymbol: getNetworkDisplaySymbol(network.symbol),
                        feeAmount: tx.errorMessage?.values?.feeAmount || '',
                    },
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                };
            }
        });

        return resultLevels;
    },
);

/**
 * Resolves the nonce to use for the next Ethereum transaction.
 *
 * For RBF (cancel / speed-up) the original tx's nonce is reused. Otherwise:
 *  - `confirmedNonce` = the backend's mined-only nonce (trezor/blockbook#1562), i.e. the on-chain
 *    transaction count. Lower bound for custom-nonce validation. Falls back to the highest confirmed
 *    (mined) outgoing nonce + 1 from the local tx list when the backend doesn't provide it. (Nonces
 *    are sequential from 0, so the latest confirmed outgoing tx's nonce + 1 is the confirmed count.)
 *  - `nonce` (signing default) = `confirmedNonce` advanced past any *contiguous* outgoing pending
 *    txs. Gapped pending txs (e.g. a stuck tx far above the confirmed nonce) are ignored, so the
 *    suggestion fills the gap instead of queueing behind an unmineable tx.
 *
 * Reads Redux/network only via TrezorConnect; the caller still passes the tx list in.
 */
export const resolveEthereumNonce = async ({
    selectedAccount,
    rbfParams,
    accountTransactions,
    fetchConfirmedNonce,
}: {
    selectedAccount: Account & { networkType: 'ethereum' };
    rbfParams?: RbfTransactionParams;
    accountTransactions: WalletAccountTransaction[];
    fetchConfirmedNonce?: boolean;
}): Promise<{ nonce: string; confirmedNonce: string }> => {
    // For RBF (cancel / speed-up) always use the original tx's nonce.
    // confirmedNonce is only consumed for custom-nonce validation (non-RBF), so mirror nonce here.
    if (rbfParams?.type === 'ethereum' && typeof rbfParams.ethereumNonce === 'number') {
        const rbfNonce = rbfParams.ethereumNonce.toString();

        return { nonce: rbfNonce, confirmedNonce: rbfNonce };
    }

    // Optionally fetch blockbook's confirmed (mined-only) nonce (trezor/blockbook#1562). It's an
    // extra backend call, so we only make it when the caller opts in; otherwise the confirmed nonce
    // is derived purely from the local tx list. When available the backend value is authoritative and
    // doesn't depend on the local tx list being complete.
    let backendConfirmedNonce: number | undefined;
    if (fetchConfirmedNonce) {
        const accountInfoResponse = await TrezorConnect.getAccountInfo({
            coin: selectedAccount.symbol,
            descriptor: selectedAccount.descriptor,
            identity: tryGetAccountIdentity(selectedAccount),
            details: 'basic',
            confirmedNonce: true,
            suppressBackupWarning: true,
        });
        if (
            accountInfoResponse.success &&
            accountInfoResponse.payload.misc?.confirmedNonce != null
        ) {
            backendConfirmedNonce = parseInt(accountInfoResponse.payload.misc.confirmedNonce, 10);
        }
    }

    const { nextNonce, confirmedNonce } = getEvmNonceInfo(
        accountTransactions,
        backendConfirmedNonce,
    );

    return { nonce: nextNonce.toString(), confirmedNonce: confirmedNonce.toString() };
};

export const ethereumGetCurrentNonceThunk = createThunk<
    { nonce: string; confirmedNonce: string },
    {
        selectedAccount: Account & { networkType: 'ethereum' };
        rbfParams?: RbfTransactionParams;
        fetchConfirmedNonce?: boolean;
    }
>(
    `${SEND_MODULE_PREFIX}/ethereumGetCurrentNonceThunk`,
    ({ selectedAccount, rbfParams, fetchConfirmedNonce }, { getState }) => {
        const transactions = selectTransactions(getState());

        return resolveEthereumNonce({
            selectedAccount,
            rbfParams,
            fetchConfirmedNonce,
            accountTransactions: transactions[selectedAccount.key] ?? [],
        });
    },
);

export const signEthereumSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signEthereumSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { dispatch, getState, rejectWithValue },
    ) => {
        const network = getNetwork(selectedAccount.symbol);

        if (selectedAccount.networkType !== 'ethereum' || !network.chainId)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Ethereum network mismatch.',
            });

        const addressDisplayType = selectAddressDisplayType(getState());

        const customNonce = formState.ethereumNonce?.trim();
        let nonce: string;

        if (customNonce) {
            // A custom nonce overrides even an RBF (speed-up / cancel) nonce — used to re-target a
            // gapped tx at the gap nonce. Validate against the real confirmed/next nonce, resolved
            // WITHOUT the RBF short-circuit (which would otherwise just echo the original nonce).
            const { nonce: autoNonce, confirmedNonce } = await dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount }),
            ).unwrap();

            const customBig = new BigNumber(customNonce);

            if (customBig.lt(confirmedNonce)) {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: `Custom nonce ${customNonce} is below the confirmed nonce ${confirmedNonce} and would be rejected by the network.`,
                });
            }

            if (customBig.gt(autoNonce)) {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: `Custom nonce ${customNonce} would create a transaction gap. Next expected nonce: ${autoNonce}.`,
                });
            }

            nonce = customNonce;
        } else {
            // No override: reuse the RBF nonce (same-nonce replace) or the next nonce for a new send.
            const { nonce: resolvedNonce } = await dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount, rbfParams: formState.rbfParams }),
            ).unwrap();
            nonce = resolvedNonce;
        }

        const { outputs: signOutputs } = formState;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignOutput: (typeof signOutputs)[number] = signOutputs[0];
        // transform to TrezorConnect.ethereumSignTransaction params
        const transaction = prepareEthereumTransaction({
            token: precomposedTransaction.token,
            chainId: network.chainId,
            to: firstSignOutput.address,
            amount: firstSignOutput.amount,
            data: formState.transactionData,
            gasLimit: precomposedTransaction.feeLimit || '',
            maxFeePerGas: precomposedTransaction.maxFeePerGas,
            maxPriorityFeePerGas: precomposedTransaction.maxPriorityFeePerGas,
            gasPrice: precomposedTransaction.feePerByte,
            nonce,
            payment_req: paymentRequests?.[0],
        });

        const response = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: selectedAccount.path,
            transaction,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!response.success) {
            // catch manual error from TransactionReviewModal
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.error.code,
                message: response.error.message,
            });
        }

        return { serializedTx: response.payload.serializedTx };
    },
);
