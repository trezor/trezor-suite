import {
    type DeviceRootState,
    isApprovalFlowSupported,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type EvmGasParamsGwei } from '@suite-common/schemas/src/evm';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    ETH_SPEED_UP_TX_MULTIPLIER,
    ETH_TRANSFER_BACKUP_GAS_LIMIT,
    STAKE_GAS_LIMIT_RESERVE,
} from '@suite-common/wallet-constants';
import {
    type AccountWithNetworkType,
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
    fromGwei,
    fromWei,
    getAccountIdentity,
    getApprovalComposeOutput,
    getCryptoMaxAmountWithReserve,
    getEthereumEstimateFeeParams,
    getEvmNonceInfo,
    getEvmNonceInfoFromConfirmedNonce,
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
import { asCoinSymbol } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

import { reportEthereumFeeEstimationFailed } from './reportEthereumFeeEstimationError';
import { sendFormActions } from './sendFormActions';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
} from '../settings/walletSettingsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import {
    selectAccountTransactions,
    selectEvmPrivatePendingHint,
} from '../transactions/transactionsSelectors';

/**
 * Returns fee info with levels bumped above the original transaction's gas price,
 * so that the replacement transaction will be accepted by the mempool.
 *
 * Expects `feeInfo` with levels already in Gwei (i.e. from selectConvertedNetworkFeeInfo).
 * `originalGasParams` must also be in Gwei.
 */
export const getEthereumRbfFeeInfo = (
    feeInfo: FeeInfo,
    originalGasParams: EvmGasParamsGwei,
): FeeInfo => {
    // feeInfo.levels are already in Gwei — do NOT call getConvertedOrDefaultFeeInfo here,
    // that would double-convert and produce near-zero values.
    const { levels } = feeInfo;
    const firstLevel: FeeLevel | undefined = levels[0];
    if (!firstLevel) return feeInfo;

    const { maxPriorityFeePerGas } = originalGasParams;
    if (isEip1559(originalGasParams) && isEip1559(firstLevel)) {
        const currentMaxFee = new BigNumber(originalGasParams.maxFeePerGas);
        const currentMaxPriorityFee = new BigNumber(maxPriorityFeePerGas ?? '0');
        const highLevel = levels.find(l => l.label === 'high') ?? firstLevel;

        // Gwei has at most 9 decimal places (1 Gwei = 1e9 Wei); multiplying by a decimal
        // multiplier can produce more, which later fails Wei conversion. Round up to keep
        // the bump at least as large as calculated.
        const newMaxFeePerGas = BigNumber.maximum(currentMaxFee, highLevel.maxFeePerGas ?? 0)
            .multipliedBy(ETH_SPEED_UP_TX_MULTIPLIER)
            .decimalPlaces(9, BigNumber.ROUND_UP)
            .toString();
        const newMaxPriorityFeePerGas = BigNumber.maximum(
            currentMaxPriorityFee,
            highLevel.maxPriorityFeePerGas ?? 0,
        )
            .multipliedBy(ETH_SPEED_UP_TX_MULTIPLIER)
            .decimalPlaces(9, BigNumber.ROUND_UP)
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

type ComposeEthereumTransactionFeeLevelsThunkState = DeviceRootState & TransactionsRootState;

export const composeEthereumTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError; state: ComposeEthereumTransactionFeeLevelsThunkState }
>(
    `${SEND_MODULE_PREFIX}/composeEthereumTransactionFeeLevelsThunk`,
    async (
        { formState, composeContext, isNetworkReserveEnabled = false },
        { dispatch, rejectWithValue, getState },
    ) => {
        const device = selectSelectedDevice(getState());

        const { account, network, feeInfo } = composeContext;
        const { transactionData } = formState;

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

        // trezor/blockbook#1639: declare our local pending txs so blockbook estimates gas against
        // the correct pending state. undefined for non-EVM / nothing pending — the field is omitted.
        const privatePending = selectEvmPrivatePendingHint(getState(), account.key);

        // gasLimit calculation based on address, amount and data size
        // amount in essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: asCoinSymbol(account.symbol),
            identity: getAccountIdentity(account),
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

            reportEthereumFeeEstimationFailed({
                account,
                formState,
                tokenInfo,
                estimateTarget: ethereumEstimateFeeParams.to,
                error: estimatedFee.error,
            });

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
        const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
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
 *  - `confirmedNonce` = the mined-only nonce from blockbook when `fetchConfirmedNonce` is true and
 *    the backend supports it (trezor/blockbook#1562), trusted as-is; otherwise the account's
 *    last-synced nonce from the backend (account.misc.nonce), reconciled against local tx data
 *    since it can be stale/pending-inclusive.
 *  - `nonce` (signing default) = `confirmedNonce` advanced past any *contiguous* outgoing pending
 *    txs. Gapped pending txs (e.g. a stuck tx far above the confirmed nonce) are ignored, so the
 *    suggestion fills the gap instead of queueing behind an unmineable tx.
 */
interface ResolveEthereumNonceParams {
    selectedAccount: AccountWithNetworkType<'ethereum'>;
    rbfParams?: RbfTransactionParams;
    accountTransactions: WalletAccountTransaction[];
    // Required (yet optional for types to match) on purpose: every caller must consciously decide whether to pay for
    // the authoritative mined-only backend nonce (outgoing txs) or skip it (RBF / display-only).
    // Silently omitting it is exactly how the staking/WalletConnect/earn flows ended up stale.
    fetchConfirmedNonce?: boolean;
}

interface ResolveEthereumNonceResult {
    nonce: string;
    confirmedNonce: string;
}

export const resolveEthereumNonce = async ({
    selectedAccount,
    rbfParams,
    accountTransactions,
    fetchConfirmedNonce,
}: ResolveEthereumNonceParams): Promise<ResolveEthereumNonceResult> => {
    // For RBF (cancel / speed-up) always use the original tx's nonce.
    // confirmedNonce is only consumed for custom-nonce validation (non-RBF), so mirror nonce here.
    if (rbfParams?.type === 'ethereum' && typeof rbfParams.ethereumNonce === 'number') {
        const rbfNonce = rbfParams.ethereumNonce.toString();

        return { nonce: rbfNonce, confirmedNonce: rbfNonce };
    }

    // Use the account's nonce from the last sync as the base. Optionally override with blockbook's
    // mined-only nonce (trezor/blockbook#1562) when the caller opts in — it costs an extra backend
    // call but is authoritative and unaffected by local pending-tx state.
    let accountNonce = parseInt(selectedAccount.misc?.nonce ?? '0', 10);
    let accountNonceIsConfirmed = false;
    if (fetchConfirmedNonce) {
        // A backend failure (rejection or unsuccessful response) must not block signing — swallow it
        // and fall back to local derivation below.
        try {
            const accountInfoResponse = await TrezorConnect.getAccountInfo({
                coin: asCoinSymbol(selectedAccount.symbol),
                descriptor: selectedAccount.descriptor,
                identity: tryGetAccountIdentity(selectedAccount),
                details: 'basic',
                confirmedNonce: true,
                suppressBackupWarning: true,
            });

            if (
                accountInfoResponse?.success &&
                accountInfoResponse.payload.misc?.confirmedNonce != null
            ) {
                accountNonce = parseInt(accountInfoResponse.payload.misc.confirmedNonce, 10);
                accountNonceIsConfirmed = true;
            }
        } catch {
            // ignore — local derivation below
        }
    }

    // A properly mined-only nonce fetched above is already trustworthy: reconciling it further
    // against local tx data (getEvmNonceInfo) would let a single bad locally-known nonce override
    // an otherwise-correct backend answer. Only account.misc.nonce (unconfirmed/untrusted) needs
    // that reconciliation.
    const { nextNonce, confirmedNonce } = accountNonceIsConfirmed
        ? getEvmNonceInfoFromConfirmedNonce(accountNonce, accountTransactions)
        : getEvmNonceInfo(accountNonce, accountTransactions);

    return { nonce: nextNonce.toString(), confirmedNonce: confirmedNonce.toString() };
};

interface EthereumGetCurrentNonceThunkParams {
    selectedAccount: AccountWithNetworkType<'ethereum'>;
    rbfParams?: RbfTransactionParams;
    // See ResolveEthereumNonceParams: temporarily required so no caller can silently fall back to the stale nonce.
    fetchConfirmedNonce?: boolean;
}

export type EthereumGetCurrentNonceThunkState = TransactionsRootState;

export const ethereumGetCurrentNonceThunk = createThunk<
    ResolveEthereumNonceResult,
    EthereumGetCurrentNonceThunkParams,
    { state: EthereumGetCurrentNonceThunkState }
>(
    `${SEND_MODULE_PREFIX}/ethereumGetCurrentNonceThunk`,
    ({ selectedAccount, rbfParams, fetchConfirmedNonce }, { getState }) => {
        // selectAccountTransactions (not the raw selectTransactions map) filters out the null
        // pagination placeholders the reducer can hold, which getEvmNonceInfo doesn't guard against.
        const accountTransactions = selectAccountTransactions(getState(), selectedAccount.key);

        return resolveEthereumNonce({
            selectedAccount,
            rbfParams,
            fetchConfirmedNonce,
            accountTransactions,
        });
    },
);

type SignEthereumSendFormTransactionThunkState = TransactionsRootState & WalletSettingsRootState;

export const signEthereumSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    {
        rejectValue: SignTransactionError;
        state: SignEthereumSendFormTransactionThunkState;
    }
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

        // Re-check the backend right before signing: the confirmed nonce may have advanced since
        // the form was composed (e.g. another wallet/session spent it), so this returns the
        // next available nonce. When a custom nonce is provided, skip rbfParams so we get the
        // actual confirmed nonce for validation instead of the RBF nonce.
        const customNonce = formState.ethereumNonce;
        const { nonce: resolvedNonce, confirmedNonce } = await dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount,
                rbfParams: customNonce ? undefined : formState.rbfParams,
                fetchConfirmedNonce: true,
            }),
        ).unwrap();

        let nonce = resolvedNonce;
        if (customNonce) {
            if (parseInt(customNonce, 10) < parseInt(confirmedNonce, 10)) {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: `Custom nonce ${customNonce} is below the confirmed nonce ${confirmedNonce}.`,
                });
            }
            nonce = customNonce;
        }

        // Store the exact nonce being signed so the review modal can display it without resolving
        // it again (which would race this in-progress signing).
        dispatch(sendFormActions.storeResolvedEthereumNonce(nonce));

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
