import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FormDraftRootState,
    WALLET_SDK_SOURCE_MOBILE,
    ethereumGetCurrentNonceThunk,
    getEthereumStakingLiveStateErrorMessage,
    getUnstakeAmountFromCalldata,
    selectAccountByKey,
    selectFormDraft,
    sendFormActions,
    transformTx,
    verifyEthereumStakingCalldata,
    verifyEthereumStakingLiveState,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { fromEther, getAccountIdentity, getFormDraftKey } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { STAKE_NATIVE_MODULE_PREFIX } from './constants';
import {
    type EthereumStakingVariant,
    type Failure,
    type PreparedEthereumStakingContext,
} from './stakeFormEthereumNativeTypes';
import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

const LOG_PREFIX = 'signEthereumStakingTransactionNativeThunk';

const failed = (message: string, detail?: string): Failure => {
    console.error(`${LOG_PREFIX}: ${detail ?? message}`);

    return { ok: false, error: { error: 'sign-transaction-failed', message } };
};

const buildEthereumStakingSignFormState = (
    feeLevel: FeeLevel,
    gasLimit: string,
    calldata: string,
    stakeType: StakeNativeType,
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

type ReadVariantFromComposeDraftState = FormDraftRootState;

// Reads the variant the form already produced at compose time and converts it to the sign-time wei value. This avoids re-encoding the calldata in the thunk.
const readVariantFromComposeDraft = (
    state: ReadVariantFromComposeDraftState,
    stakeType: StakeNativeType,
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

type PrepareEthereumStakingContextState = AccountsRootState & FormDraftRootState;

const prepareEthereumStakingContext = (
    state: PrepareEthereumStakingContextState,
    args: {
        accountKey: AccountKey;
        stakeType: StakeNativeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
): { ok: true; context: PreparedEthereumStakingContext } | Failure => {
    const { accountKey, stakeType, precomposedTransaction } = args;

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
        source: WALLET_SDK_SOURCE_MOBILE,
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

export type SignEthereumStakingTransactionNativeThunkState = PrepareEthereumStakingContextState &
    DeviceRootState;

export const signEthereumStakingTransactionNativeThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: StakeNativeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeNativeRejectValue;
        state: SignEthereumStakingTransactionNativeThunkState;
    }
>(
    `${STAKE_NATIVE_MODULE_PREFIX}/${LOG_PREFIX}`,
    async ({ accountKey, stakeType, precomposedTransaction }, thunkApi) => {
        const { dispatch, getState, rejectWithValue } = thunkApi;

        try {
            const prepared = prepareEthereumStakingContext(getState(), {
                accountKey,
                stakeType,
                precomposedTransaction,
            });
            if (!prepared.ok) return rejectWithValue(prepared.error);

            const { account, chainId, gasLimit, variant, feeLevel, formState } = prepared.context;

            const liveState = await verifyEthereumStakingLiveState({
                stakeType,
                from: account.descriptor,
                symbol: account.symbol,
                identity: getAccountIdentity(account),
                amount:
                    stakeType === 'unstake'
                        ? (getUnstakeAmountFromCalldata(variant.calldata) ?? undefined)
                        : undefined,
            });
            if (!liveState.isValid) {
                console.error(
                    `${LOG_PREFIX}: Live-state validation failed for ${stakeType}: ${liveState.reason.code}`,
                );

                return rejectWithValue({
                    error: 'stake-live-state-invalid',
                    message: getEthereumStakingLiveStateErrorMessage(liveState.reason),
                });
            }

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState,
                    precomposedTransaction,
                    accountKey,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(async () => {
                const device = selectSelectedDevice(getState());

                const { nonce } = await dispatch(
                    ethereumGetCurrentNonceThunk({
                        selectedAccount: account,
                        fetchConfirmedNonce: true,
                    }),
                ).unwrap();

                const tx = transformTx(
                    {
                        to: variant.contractAddress,
                        value: variant.value,
                        gasLimit: new BigNumber(gasLimit)
                            .integerValue(BigNumber.ROUND_DOWN)
                            .toNumber(),
                        data: variant.calldata,
                    },
                    String(nonce),
                    chainId,
                    feeLevel.maxFeePerGas ? undefined : feeLevel.feePerUnit,
                    feeLevel.maxFeePerGas,
                    feeLevel.maxPriorityFeePerGas,
                );

                return TrezorConnect.ethereumSignTransaction({
                    device: device
                        ? {
                              path: device.path,
                              instance: device.instance,
                              state: device.state,
                              useEmptyPassphrase: device.useEmptyPassphrase,
                          }
                        : undefined,
                    path: account.path,
                    transaction: tx,
                });
            });

            if (!deviceAccessResponse.success) {
                const message = `Prioritized device access or ${stakeType} preparation failed.`;
                console.error(`${LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const signResponse = deviceAccessResponse.payload;

            if (!signResponse.success) {
                if (signResponse.error.message !== 'tx-cancelled') {
                    console.error(
                        `${LOG_PREFIX}: Sign transaction failed: ${signResponse.error.message}`,
                    );
                }

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    errorCode: signResponse.error.code,
                    message: signResponse.error.message,
                });
            }

            const { serializedTx } = signResponse.payload;

            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: { tx: serializedTx, symbol: account.symbol },
                }),
            );
        } catch (error) {
            console.error(`${LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
