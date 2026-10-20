import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import {
    fromEther,
    fromGwei,
    fromIntegerString,
    fromWei,
    getAccountIdentity,
    sanitizeHex,
} from '@suite-common/wallet-utils';
import {
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
    type FeeLevel,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    getEthereumStakingLiveStateErrorMessage,
    readEthereumStakingPools,
} from './ethereumStakingLiveState';
import {
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
    getEthereumStakingAdapter,
} from './providers/ethereumStakingProviders';
import { type EthereumStakingAccount } from './providers/types';
import { type EthereumStakingTransactionDraft } from './types';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';
import { type SignTransactionError } from '../../send/sendFormTypes';
import { WALLET_SDK_SOURCE } from '../shared/stakingConstants';

const PREPARE_LOG_PREFIX = 'prepareEthereumStakingContext';
const LIVE_STATE_LOG_PREFIX = 'verifyEthereumStakingLiveStateForSign';

export type { EthereumStakingAccount };

export type EthereumStakingVariant = {
    stakeType: BaseStakeType;
    calldata: string;
    contractAddress: string;
    value: string;
};

export type PreparedEthereumStakingContext = {
    account: EthereumStakingAccount;
    chainId: number;
    gasLimit: string;
    variant: EthereumStakingVariant;
    feeLevel: FeeLevel;
    formState: StakeFormState;
};

// Distinct from SignTransactionError so the UI can tell "can't sign right now" apart from "device disconnected".
export type StakeLiveStateInvalidError = {
    error: 'stake-live-state-invalid';
    message: string;
};

type PrepareFailure = { ok: false; error: SignTransactionError };

const failed = (message: string, detail?: string): PrepareFailure => {
    console.error(`${PREPARE_LOG_PREFIX}: ${detail ?? message}`);

    return { ok: false, error: { error: 'sign-transaction-failed', message } };
};

const buildEthereumStakingSignFormState = (
    feeLevel: FeeLevel,
    gasLimit: string,
    calldata: string,
    stakeType: BaseStakeType,
): StakeFormState => ({
    outputs: [],
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: gasLimit,
    transactionData: calldata,
    stakeType,
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    ...(feeLevel.maxFeePerGas
        ? {
              maxFeePerGas: feeLevel.maxFeePerGas,
              maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas ?? '0',
              baseFeePerGas: feeLevel.baseFeePerGas ?? undefined,
          }
        : {}),
});

// Reads the variant produced at compose time and converts it to the sign-time wei value, so the
// calldata is never re-encoded at sign time. The composed fee level carries the calldata; the form
// draft is the fallback for flows that still compose through the send form.
const readComposedVariant = (
    formValues: StakeFormState,
    precomposedTransaction: PrecomposedTransactionFinal,
    stakeType: BaseStakeType,
): EthereumStakingVariant | null => {
    const calldata = precomposedTransaction.transactionData || formValues.transactionData;
    const contractAddress = formValues.outputs[0]?.address;
    const composeAmount = formValues.outputs[0]?.amount;

    if (!calldata || !contractAddress || !composeAmount) return null;

    if (stakeType === 'stake' && !new BigNumber(composeAmount).isGreaterThan(0)) {
        return null;
    }

    return {
        stakeType,
        calldata,
        contractAddress,
        value: stakeType === 'stake' ? fromEther(composeAmount).toWei() : '0',
    };
};

export type PrepareEthereumStakingContextState = AccountsRootState;

type PrepareEthereumStakingContextParams = {
    accountKey: AccountKey;
    stakeType: BaseStakeType;
    precomposedTransaction: PrecomposedTransactionFinal;
    formValues: StakeFormState;
    source?: string;
};

export const prepareEthereumStakingContext = (
    state: PrepareEthereumStakingContextState,
    {
        accountKey,
        stakeType,
        precomposedTransaction,
        formValues,
        source = WALLET_SDK_SOURCE,
    }: PrepareEthereumStakingContextParams,
): { ok: true; context: PreparedEthereumStakingContext } | PrepareFailure => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'ethereum') {
        return failed('Ethereum account not found.');
    }

    const { chainId } = getNetwork(account.symbol);
    if (!chainId) {
        return failed(
            'Chain ID not found for network.',
            `Chain ID not found for network ${account.symbol}`,
        );
    }

    const gasLimit = precomposedTransaction.feeLimit;
    if (!gasLimit) {
        return failed('Selected fee level is missing gas limit.');
    }

    const variant = readComposedVariant(formValues, precomposedTransaction, stakeType);

    if (!variant) {
        return failed(`Compose result for ${stakeType} is incomplete.`);
    }

    const adapter = getEthereumStakingAdapter(DEFAULT_ETHEREUM_STAKING_PROVIDER_ID);

    const calldataCheck = adapter.verifyStep({ label: stakeType, data: variant.calldata }, source);

    if (!calldataCheck.isValid) {
        return failed(
            'Compose draft calldata failed verification.',
            `Verifier issues for ${stakeType}: ${JSON.stringify(calldataCheck.issues)}`,
        );
    }

    const feeLevel: FeeLevel = {
        label: 'normal',
        blocks: -1,
        feePerUnit: precomposedTransaction.feePerByte,
        feeLimit: gasLimit,
        maxFeePerGas: precomposedTransaction.maxFeePerGas,
        maxPriorityFeePerGas: precomposedTransaction.maxPriorityFeePerGas,
    };

    const formState = buildEthereumStakingSignFormState(
        feeLevel,
        gasLimit,
        variant.calldata,
        variant.stakeType,
    );

    return {
        ok: true,
        context: {
            account,
            chainId,
            gasLimit,
            variant,
            feeLevel,
            formState,
        },
    };
};

interface VerifyEthereumStakingLiveStateForSignProps {
    stakeType: BaseStakeType;
    account: EthereumStakingAccount;
    calldata: string;
}

// Re-checks the on-chain staking state right before signing (e.g. that the unstake
// amount is still withdrawable), so a stale compose result cannot be signed.
export const verifyEthereumStakingLiveStateForSign = async ({
    stakeType,
    account,
    calldata,
}: VerifyEthereumStakingLiveStateForSignProps): Promise<
    { isValid: true } | { isValid: false; error: StakeLiveStateInvalidError }
> => {
    const adapter = getEthereumStakingAdapter(DEFAULT_ETHEREUM_STAKING_PROVIDER_ID);

    const liveState = await adapter.validateLiveState(
        { label: stakeType, data: calldata },
        {
            account,
            readStakingPools: () =>
                readEthereumStakingPools({
                    symbol: account.symbol,
                    descriptor: account.descriptor,
                    identity: getAccountIdentity(account),
                }),
        },
    );

    if (!liveState.isValid) {
        console.error(
            `${LIVE_STATE_LOG_PREFIX}: Live-state validation failed for ${stakeType}: ${liveState.reason.code}`,
        );

        return {
            isValid: false,
            error: {
                error: 'stake-live-state-invalid',
                message: getEthereumStakingLiveStateErrorMessage(liveState.reason),
            },
        };
    }

    return { isValid: true };
};

export const transformTx = (
    tx: EthereumStakingTransactionDraft,
    nonce: string,
    chainId: number,
    gasPrice?: string,
    maxFeePerGas?: string,
    maxPriorityFeePerGas?: string,
): EthereumTransaction | EthereumTransactionEIP1559 => {
    let result: EthereumTransaction | EthereumTransactionEIP1559;

    const commonTxData = {
        to: tx.to,
        // in send form, the amount is in ether, here in wei because it is converted earlier in stake, unstake, claimToWithdraw methods
        value: fromWei(tx.value).toWei('hex'),
        chainId,
        nonce: fromIntegerString(nonce).toHex(),
        gasLimit: fromIntegerString(tx.gasLimit.toString()).toHex(),
        data: sanitizeHex(tx.data),
    };

    if (maxFeePerGas) {
        result = {
            ...commonTxData,
            gasPrice: undefined,
            maxFeePerGas: fromGwei(maxFeePerGas).toWei('hex'),
            maxPriorityFeePerGas: fromGwei(maxPriorityFeePerGas || '0').toWei('hex'),
        };
    } else if (gasPrice) {
        result = {
            ...commonTxData,
            gasPrice: fromGwei(gasPrice).toWei('hex'),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
        };
    } else {
        throw new Error('No gas price or maxFeePerGas and maxPriorityFeePerGas provided');
    }

    return result;
};

// Transforms the prepared context into TrezorConnect.ethereumSignTransaction params.
export const buildEthereumStakingSignTransaction = (
    { variant, gasLimit, chainId, feeLevel }: PreparedEthereumStakingContext,
    nonce: string,
) =>
    transformTx(
        {
            to: variant.contractAddress,
            value: variant.value,
            gasLimit: new BigNumber(gasLimit).integerValue(BigNumber.ROUND_DOWN).toNumber(),
            data: variant.calldata,
        },
        nonce,
        chainId,
        feeLevel.maxFeePerGas ? undefined : feeLevel.feePerUnit,
        feeLevel.maxFeePerGas,
        feeLevel.maxPriorityFeePerGas,
    );
