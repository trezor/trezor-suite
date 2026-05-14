import { selectSelectedDevice } from '@suite-common/device';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import { transformTx, verifyEthereumStakingCalldata } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    ethereumGetCurrentNonceThunk,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectFormDraft,
    selectIsMevProtectionEnabled,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import {
    type EthereumAccount,
    type EthereumStakingType,
    type EthereumStakingVariant,
    type Failure,
    type PreparedEthereumStakingContext,
    type SignEthereumStakingRejectValue,
} from './stakeFormEthereumNativeTypes';
import { ethToWei } from './utils';

const STAKE_NATIVE_MODULE_PREFIX = '@suite-native/staking';
const LOG_PREFIX = 'signEthereumStakingTransactionNativeThunk';

const failed = (message: string, detail?: string): Failure => {
    console.error(`${LOG_PREFIX}: ${detail ?? message}`);

    return { ok: false, error: { error: 'sign-transaction-failed', message } };
};

const buildEthereumStakingSignFormState = (
    feeLevel: FeeLevel,
    gasLimit: string,
    calldata: string,
    stakeType: EthereumStakingType,
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

// Reads the variant the form already produced at compose time and converts it to the sign-time wei value. This avoids re-encoding the calldata in the thunk.
const readVariantFromComposeDraft = (
    state: Parameters<typeof selectFormDraft>[0],
    stakeType: EthereumStakingType,
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
        value: stakeType === 'stake' ? ethToWei(composeAmount) : '0',
    };
};

const prepareEthereumStakingContext = (
    state: Parameters<typeof selectAccountByKey>[0] & Parameters<typeof selectFormDraft>[0],
    args: {
        accountKey: AccountKey;
        stakeType: EthereumStakingType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
): { ok: true; context: PreparedEthereumStakingContext } | Failure => {
    const { accountKey, stakeType, precomposedTransaction } = args;

    const account = selectAccountByKey(state, accountKey);
    if (!account || account.networkType !== 'ethereum') {
        return failed(
            'Ethereum account not found.',
            `Ethereum account not found for key ${accountKey}`,
        );
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
            `Form draft '${getFormDraftKey(stakeType, accountKey)}' is missing or incomplete.`,
        );
    }

    const calldataCheck = verifyEthereumStakingCalldata({
        stakeType,
        calldata: variant.calldata,
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
            account: account as EthereumAccount,
            chainId,
            gasLimit,
            variant,
            feeLevel,
            formState,
        },
    };
};

export const signEthereumStakingTransactionNativeThunk = createThunk<
    { txid: string },
    {
        accountKey: AccountKey;
        stakeType: EthereumStakingType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    { rejectValue: SignEthereumStakingRejectValue }
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
                    ethereumGetCurrentNonceThunk({ selectedAccount: account }),
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

            const isMevProtectionEnabled =
                selectIsMevProtectionEnabled(getState()) &&
                selectIsMevProtectionFeatureEnabled(getState());

            const pushAction = await dispatch(
                pushSendFormTransactionThunk({
                    selectedAccount: account,
                    isMevProtectionEnabled,
                }),
            );

            if (pushSendFormTransactionThunk.rejected.match(pushAction)) {
                const message = pushAction.payload?.metadata.error.message;
                console.error(`${LOG_PREFIX}: Push transaction failed: ${message}`);

                return rejectWithValue(pushAction.payload);
            }

            return { txid: pushAction.payload.payload.txid };
        } catch (error) {
            console.error(`${LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
