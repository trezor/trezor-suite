import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type BaseStakeType,
    type FormState,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { fromEther, getAccountIdentity, getFormDraftKey } from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    getEthereumStakingLiveStateErrorMessage,
    getUnstakeAmountFromCalldata,
    transformTx,
    verifyEthereumStakingCalldata,
    verifyEthereumStakingLiveState,
} from './ethereumStaking';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';
import { type FormDraftRootState } from '../../formDrafts/formDraftSlice';
import { selectFormDraft } from '../../formDrafts/selectors';
import { type SignTransactionError } from '../../send/sendFormTypes';

const PREPARE_LOG_PREFIX = 'prepareEthereumStakingContext';
const LIVE_STATE_LOG_PREFIX = 'verifyEthereumStakingLiveStateForSign';

export type EthereumStakingAccount = Account & { networkType: 'ethereum' };

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

// Reads the variant the form already produced at compose time and converts it to the sign-time wei value. This avoids re-encoding the calldata at sign time.
const readVariantFromComposeDraft = (
    state: FormDraftRootState,
    stakeType: BaseStakeType,
    accountKey: AccountKey,
): EthereumStakingVariant | null => {
    const draft = selectFormDraft<FormState>(state, getFormDraftKey(stakeType, accountKey));
    const calldata = draft?.transactionData;
    const contractAddress = draft?.outputs[0]?.address;
    const composeAmount = draft?.outputs[0]?.amount;

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

export type PrepareEthereumStakingContextState = AccountsRootState & FormDraftRootState;

export const prepareEthereumStakingContext = (
    state: PrepareEthereumStakingContextState,
    args: {
        accountKey: AccountKey;
        stakeType: BaseStakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
        source?: string;
    },
): { ok: true; context: PreparedEthereumStakingContext } | PrepareFailure => {
    const { accountKey, stakeType, precomposedTransaction, source } = args;

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

    const variant = readVariantFromComposeDraft(state, stakeType, accountKey);
    if (!variant) {
        return failed(
            `Compose draft for ${stakeType} is missing.`,
            `Compose draft for ${stakeType} is missing or incomplete.`,
        );
    }

    const calldataCheck = verifyEthereumStakingCalldata({
        stakeType,
        calldata: variant.calldata,
        source,
    });
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
    const liveState = await verifyEthereumStakingLiveState({
        stakeType,
        from: account.descriptor,
        symbol: account.symbol,
        identity: getAccountIdentity(account),
        amount:
            stakeType === 'unstake'
                ? (getUnstakeAmountFromCalldata(calldata) ?? undefined)
                : undefined,
    });

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
