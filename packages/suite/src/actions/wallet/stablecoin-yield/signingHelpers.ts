import { type Dispatch, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { WALLET_MISMATCH_ERROR_CODE } from '@suite/device';
import {
    type ModalRootState,
    closeModal,
    openDeferredModal,
    preserveModal,
    selectIsTransactionReviewActive,
} from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type StablecoinYieldTxSimulationParams,
    buildStablecoinYieldTransactionReview,
} from '@suite-common/earn-stablecoin';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type SynchronizeSentTransactionThunkDeps,
    type SynchronizeSentTransactionThunkState,
    type WalletSettingsRootState,
    type YieldFlowDisplayToken,
    type YieldFlowType,
    isEarnSigningCancelled,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    synchronizeSentTransactionThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type EvmSelectedFee,
    type FeeLevelLabel,
} from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';
import { ERRORS, asCoinSymbol } from '@trezor/connect-common';

import { getDeviceErrorMessage } from '#src/utils/wallet/getDeviceErrorMessage';

// Marks failures of the final broadcast — the transaction is already signed at that point,
// which deserves a more specific message than the generic one.
export const PUSH_TRANSACTION_FAILED_CAUSE = 'PushTransactionFailed';

export const isYieldPushError = (error: unknown) =>
    error instanceof Error && error.cause === PUSH_TRANSACTION_FAILED_CAUSE;

export const getYieldErrorTranslationKey = (error: unknown) => {
    if (!(error instanceof Error)) {
        return 'TR_EARN_YIELD_ERROR_GENERIC';
    }

    if (isYieldPushError(error)) {
        return 'TR_EARN_YIELD_ERROR_PUSH_FAILED';
    }

    return 'TR_EARN_YIELD_ERROR_GENERIC';
};

// Device problems are reported by a toast, like in Send and trading; other errors stay in the form.
export const getYieldDeviceErrorMessage = (error: unknown) =>
    error instanceof Error
        ? getDeviceErrorMessage({ code: error.cause, message: error.message })
        : undefined;

type ShowYieldSubmitErrorThunkParams = {
    flowType: YieldFlowType;
    flowKey: string;
    error: unknown;
};

export const showYieldSubmitErrorThunk =
    ({ flowType, flowKey, error }: ShowYieldSubmitErrorThunkParams) =>
    (dispatch: Dispatch) => {
        const deviceError = getYieldDeviceErrorMessage(error);

        if (deviceError) {
            dispatch(notificationsActions.addToast({ type: 'sign-tx-error', error: deviceError }));

            return;
        }

        dispatch(
            yieldActions.setError({ flowType, flowKey, error: getYieldErrorTranslationKey(error) }),
        );
    };

export const getYieldSubmitErrorAnalyticsMessage = (error: unknown) =>
    isYieldPushError(error) ? 'push-failed' : 'submit-failed';

export const createYieldSigningDeviceError = (
    device: TrezorDevice | undefined,
    account: Pick<Account, 'deviceState'>,
) =>
    device?.connected && device.available && device.state?.staticSessionId !== account.deviceState
        ? new Error('Wallet mismatch', { cause: WALLET_MISMATCH_ERROR_CODE })
        : new Error(ERRORS.ERROR_CODES.Device_Disconnected, { cause: 'Device_Disconnected' });

export const isYieldSigningDevice = (
    device: TrezorDevice | undefined,
    account: Pick<Account, 'deviceState'>,
): device is TrezorDevice =>
    !!device?.connected &&
    device.available &&
    device.state?.staticSessionId === account.deviceState;

type OpenYieldSimulationThunkState = DeviceRootState;

export const openYieldSimulationThunk =
    (
        data: StablecoinYieldTxSimulationParams & { account: Pick<Account, 'deviceState'> },
        owner: TrezorDevice | undefined,
    ) =>
    (
        dispatch: ThunkDispatch<OpenYieldSimulationThunkState, unknown, UnknownAction>,
        getState: () => OpenYieldSimulationThunkState,
    ) => {
        const device = selectSelectedDevice(getState());
        if (
            !owner?.path ||
            !isYieldSigningDevice(device, data.account) ||
            device.path !== owner.path ||
            device.instance !== owner.instance ||
            !device.state?.staticSessionId ||
            device.state.staticSessionId !== owner.state?.staticSessionId
        ) {
            return Promise.reject(createYieldSigningDeviceError(device, data.account));
        }

        return dispatch(
            openDeferredModal(
                { type: 'earn-yield-tx-simulation', data },
                { devicePath: device.path, cancelWith: { value: false } },
            ),
        );
    };

type PushYieldTransactionState = ModalRootState & MessageSystemRootState & WalletSettingsRootState;

type PushYieldTransactionParams = {
    account: Account;
    serializedTx: string;
    reviewDecision: Promise<boolean>;
};

export const pushYieldTransaction = async (
    { account, serializedTx, reviewDecision }: PushYieldTransactionParams,
    dispatch: Dispatch,
    getState: () => PushYieldTransactionState,
) => {
    try {
        const isMevProtectionEnabled = selectIsMevProtectionEnabled(getState());
        const isMevProtectionFeatureEnabled = selectIsMevProtectionFeatureEnabled(getState());

        return await TrezorBlockchain.pushTransaction({
            tx: serializedTx,
            coin: asCoinSymbol(account.symbol),
            identity: getAccountIdentity(account),
            disableAlternativeRPC: !isMevProtectionEnabled || !isMevProtectionFeatureEnabled,
        });
    } finally {
        if (selectIsTransactionReviewActive(getState(), reviewDecision)) {
            dispatch(closeModal());
        }
    }
};

export type SendYieldTransactionState = DeviceRootState &
    SynchronizeSentTransactionThunkState &
    PushYieldTransactionState;
export type SendYieldTransactionDeps = SynchronizeSentTransactionThunkDeps;
type SendYieldTransactionDispatch = ThunkDispatch<
    SendYieldTransactionState,
    SendYieldTransactionDeps,
    UnknownAction
>;

// Genuine failures are thrown — a returned `cancelled` is always the user backing out on purpose.
export type SendYieldTransactionResult =
    | { status: 'sent'; txid: string; fee: string; nonce: number }
    | { status: 'cancelled'; stage: 'signing' | 'review' };

export type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    unsignedTransaction: string;
    flowKey: string;
    flowType: YieldFlowType;
    dispatch: SendYieldTransactionDispatch;
    getState: () => SendYieldTransactionState;
    selectedFee: EvmSelectedFee | null;
    selectedFeeLevel: FeeLevelLabel;
};

export const sendYieldTransaction = async ({
    account,
    amount,
    token,
    unsignedTransaction,
    flowKey,
    flowType,
    dispatch,
    getState,
    selectedFee,
    selectedFeeLevel,
}: SendYieldTransactionParams): Promise<SendYieldTransactionResult> => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!isYieldSigningDevice(device, account)) {
        throw createYieldSigningDeviceError(device, account);
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const transactionReview = buildStablecoinYieldTransactionReview({
        unsignedTransaction,
        selectedFee,
        selectedFeeLevel,
        amount,
        token,
        symbol: account.symbol,
    });

    const { transactionForSigning, formState, precomposedTransaction } = transactionReview;
    const nonce = parseInt(transactionForSigning.nonce, 16);

    dispatch(
        yieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            // transactionForSigning.nonce is hex; store a decimal string so the review modal shows
            // it like the Send flow.
            precomposedForm: {
                ...formState,
                ethereumNonce: nonce.toString(),
            },
            accountKey: account.key,
            flowKey,
            flowType,
        }),
    );

    try {
        dispatch(preserveModal());

        const signingResponse = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            const { code } = signingResponse.error;
            if (isEarnSigningCancelled(signingResponse.error)) {
                return { status: 'cancelled', stage: 'signing' };
            }

            throw new Error(`${code}: ${signingResponse.error.message}`, { cause: code });
        }

        dispatch(
            yieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        const reviewDecision = dispatch(
            openDeferredModal(
                { type: 'review-transaction' },
                { devicePath: device.path, cancelWith: false },
            ),
        );

        if (!(await reviewDecision)) {
            return { status: 'cancelled', stage: 'review' };
        }

        const pushResponse = await pushYieldTransaction(
            { account, serializedTx: signingResponse.payload.serializedTx, reviewDecision },
            dispatch,
            getState,
        );

        if (!pushResponse.success) {
            throw new Error(`${pushResponse.error.code}: ${pushResponse.error.message}`, {
                cause: PUSH_TRANSACTION_FAILED_CAUSE,
            });
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction,
                precomposedForm: formState,
                txid: pushResponse.payload.txid,
                // transactionForSigning.nonce is hex; the fake pending tx expects a decimal string.
                ethereumNonce: nonce.toString(),
            }),
        );

        return {
            status: 'sent',
            txid: pushResponse.payload.txid,
            fee: precomposedTransaction.fee,
            nonce,
        };
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        dispatch(yieldActions.discardTransaction());
    }
};
