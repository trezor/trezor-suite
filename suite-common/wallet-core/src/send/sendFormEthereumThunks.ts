import {
    type DeviceRootState,
    isApprovalFlowSupported,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type EvmGasParamsGwei } from '@suite-common/schemas/src/evm';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getNetwork } from '@suite-common/wallet-config';
import { ETH_SPEED_UP_TX_MULTIPLIER } from '@suite-common/wallet-constants';
import {
    type Account,
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
    getEvmNonceInfo,
    getEvmNonceInfoFromConfirmedNonce,
    isEip1559,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel, type TokenInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import {
    calculateEvmTransfer,
    createEthereumChainSend,
} from '@trezor/network-ethereum-suite-common';
import { ChainSendError } from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { chainSendConnectDeps, toChainSendDevice } from './chainSendAdapter';
import { handleEvmFeeEstimationFailure } from './reportEthereumFeeEstimationError';
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
    const network = composeContext && getNetwork(composeContext.account.symbol);

    return calculateEvmTransfer(
        availableBalance,
        output,
        feeLevel,
        token,
        composeContext && network
            ? {
                  decimals: network.decimals,
                  formattedBalance: composeContext.account.formattedBalance,
                  isNetworkReserveEnabled,
                  nativeTokenReserve: network.nativeTokenReserve,
              }
            : undefined,
    );
};

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

type EvmSendThunkApi = {
    dispatch: (action: any) => any;
    getState: () => TransactionsRootState;

    /** The device the transaction is composed for or signed on. */
    device: TrezorDevice | undefined;
};

/** The EVM network's send, given the app's knowledge of the account from Redux. */
const createSend = (account: Account, { dispatch, getState, device }: EvmSendThunkApi) =>
    createEthereumChainSend({
        ...chainSendConnectDeps,
        isApprovalFlowSupported: () => isApprovalFlowSupported(device),
        getEvmPrivatePendingHint: () => selectEvmPrivatePendingHint(getState(), account.key),
        resolveEvmNonce: ({ rbfParams, fetchConfirmedNonce }) =>
            dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account as AccountWithNetworkType<'ethereum'>,
                    rbfParams,
                    fetchConfirmedNonce,
                }),
            ).unwrap(),
        onEvmFeeEstimationFailed: failure =>
            handleEvmFeeEstimationFailure(dispatch, account, failure),
    })(account.symbol);

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
        const { account } = composeContext;

        try {
            const device = selectSelectedDevice(getState());

            return await createSend(account, { dispatch, getState, device }).composeFeeLevels({
                account,
                draft: formState,
                context: { ...composeContext, isNetworkReserveEnabled },
            });
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: error.message,
            });
        }
    },
);

export type SignEthereumSendFormTransactionThunkState = TransactionsRootState &
    WalletSettingsRootState;

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
        if (selectedAccount.networkType !== 'ethereum')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Ethereum network mismatch.',
            });

        const addressDisplayType = selectAddressDisplayType(getState());

        try {
            const send = createSend(selectedAccount, { dispatch, getState, device });
            const { serializedTx } = await send.sign({
                account: selectedAccount,
                draft: formState,
                precomposed: precomposedTransaction,
                options: {
                    device: toChainSendDevice(device),
                    chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
                    paymentRequests,
                    // Store the exact nonce being signed so the review modal can display it
                    // without resolving it again (which would race this in-progress signing).
                    onPrepared: ({ nonce }) => {
                        if (nonce) dispatch(sendFormActions.storeResolvedEthereumNonce(nonce));
                    },
                },
            });

            return { serializedTx };
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: error.connectErrorCode,
                message: error.message,
            });
        }
    },
);
