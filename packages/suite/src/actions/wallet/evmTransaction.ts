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
import {
    type SynchronizeSentTransactionThunkDeps,
    type SynchronizeSentTransactionThunkState,
    type WalletSettingsRootState,
    type YieldFlowDisplayToken,
    type YieldFlowType,
    type YieldRootState,
    isEarnSigningCancelled,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    selectYieldTxReview,
    synchronizeSentTransactionThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type EvmSelectedFee,
    type FeeLevelLabel,
    type FormState,
    type FormStateTxType,
    type PrecomposedTransactionFinal,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';
import { ERRORS, type EthereumSignTransaction, asCoinSymbol } from '@trezor/connect-common';

export const PUSH_TRANSACTION_FAILED_CAUSE = 'PushTransactionFailed';

export const isEvmBroadcastError = (error: unknown) =>
    error instanceof Error && error.cause === PUSH_TRANSACTION_FAILED_CAUSE;

const getEvmSigningDevice = (
    device: TrezorDevice | undefined,
    owner: TrezorDevice | undefined,
    account: Pick<Account, 'deviceState'>,
) => {
    if (
        device?.connected &&
        device.available &&
        device.state?.staticSessionId !== account.deviceState
    ) {
        throw new Error('Wallet mismatch', { cause: WALLET_MISMATCH_ERROR_CODE });
    }

    if (
        !owner?.path ||
        !device?.connected ||
        !device.available ||
        device.path !== owner.path ||
        device.instance !== owner.instance ||
        !device.state?.staticSessionId ||
        device.state.staticSessionId !== owner.state?.staticSessionId
    ) {
        throw new Error(ERRORS.ERROR_CODES.Device_Disconnected, { cause: 'Device_Disconnected' });
    }

    return { device, devicePath: owner.path };
};

type OpenEvmTransactionSimulationThunkState = DeviceRootState;

export const openEvmTransactionSimulationThunk =
    (
        data: StablecoinYieldTxSimulationParams & { account: Pick<Account, 'deviceState'> },
        owner: TrezorDevice | undefined,
    ) =>
    async (
        dispatch: ThunkDispatch<OpenEvmTransactionSimulationThunkState, unknown, UnknownAction>,
        getState: () => OpenEvmTransactionSimulationThunkState,
    ) => {
        const { devicePath } = getEvmSigningDevice(
            selectSelectedDevice(getState()),
            owner,
            data.account,
        );

        return await dispatch(
            openDeferredModal(
                { type: 'earn-yield-tx-simulation', data },
                { devicePath, cancelWith: { value: false } },
            ),
        );
    };

type BroadcastEvmTransactionState = ModalRootState &
    MessageSystemRootState &
    WalletSettingsRootState;

type BroadcastEvmTransactionParams = {
    account: Account;
    serializedTx: string;
    reviewDecision: Promise<boolean>;
};

const broadcastEvmTransaction = async (
    { account, serializedTx, reviewDecision }: BroadcastEvmTransactionParams,
    dispatch: Dispatch,
    getState: () => BroadcastEvmTransactionState,
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

export type SendEvmTransactionState = DeviceRootState &
    YieldRootState &
    SynchronizeSentTransactionThunkState &
    BroadcastEvmTransactionState;
export type SendEvmTransactionDeps = SynchronizeSentTransactionThunkDeps;
type SendEvmTransactionDispatch = ThunkDispatch<
    SendEvmTransactionState,
    SendEvmTransactionDeps,
    UnknownAction
>;

type SendEvmTransactionResult =
    | { status: 'sent'; txid: string; fee: string }
    | { status: 'cancelled'; stage: 'signing' | 'review' };

type EvmTransactionReview = {
    transactionForSigning: EthereumSignTransaction['transaction'];
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    availableRewards?: YieldClaimReward[];
};

type EvmSimulationFeeSelection = {
    selectedFee: EvmSelectedFee | null;
    selectedFeeLevel: FeeLevelLabel;
};

type SendEvmTransactionParams = {
    account: Account;
    device: TrezorDevice | undefined;
    txType: FormStateTxType;
    yieldFlow?: { flowKey: string; flowType: YieldFlowType };
    simulation: EvmSimulationFeeSelection & { resolve: () => void };
    prepareReview: (feeSelection: EvmSimulationFeeSelection) => EvmTransactionReview;
    dispatch: SendEvmTransactionDispatch;
    getState: () => SendEvmTransactionState;
};

export const sendEvmTransaction = async ({
    account,
    device: owner,
    txType,
    yieldFlow,
    simulation,
    prepareReview,
    dispatch,
    getState,
}: SendEvmTransactionParams): Promise<SendEvmTransactionResult> => {
    try {
        const { device, devicePath } = getEvmSigningDevice(
            selectSelectedDevice(getState()),
            owner,
            account,
        );
        const addressDisplayType = selectAddressDisplayType(getState());

        if (account.networkType !== 'ethereum') {
            throw new Error('Contract signing requires an EVM account.');
        }

        const { transactionForSigning, formState, precomposedTransaction, availableRewards } =
            prepareReview(simulation);
        const ethereumNonce = BigInt(transactionForSigning.nonce).toString();
        const precomposedForm = { ...formState, ethereumNonce, txType };

        dispatch(
            yieldActions.storePrecomposedTransaction({
                flowKey: yieldFlow?.flowKey,
                flowType: yieldFlow?.flowType,
                precomposedTx: precomposedTransaction,
                precomposedForm,
                availableRewards,
                accountKey: account.key,
            }),
        );

        try {
            dispatch(preserveModal());

            const signingResponse = await TrezorConnect.ethereumSignTransaction({
                device: {
                    path: devicePath,
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

                if (isEarnSigningCancelled(signingResponse.error)) {
                    return { status: 'cancelled', stage: 'signing' };
                }

                const { code, message } = signingResponse.error;
                throw new Error(`${code}: ${message}`, { cause: code });
            }

            const { serializedTx } = signingResponse.payload;
            dispatch(
                yieldActions.storeSignedTransaction({
                    serializedTx: { tx: serializedTx, symbol: account.symbol },
                }),
            );

            const reviewDecision = dispatch(
                openDeferredModal(
                    { type: 'review-transaction' },
                    { devicePath, cancelWith: false },
                ),
            );

            if (!(await reviewDecision)) {
                return { status: 'cancelled', stage: 'review' };
            }

            const pushResponse = await broadcastEvmTransaction(
                { account, serializedTx, reviewDecision },
                dispatch,
                getState,
            );

            if (!pushResponse.success) {
                const { code, message } = pushResponse.error;
                throw new Error(`${code}: ${message}`, { cause: PUSH_TRANSACTION_FAILED_CAUSE });
            }

            const { txid } = pushResponse.payload;
            dispatch(
                synchronizeSentTransactionThunk({
                    selectedAccount: account,
                    precomposedTransaction,
                    precomposedForm,
                    txid,
                    ethereumNonce,
                }),
            );

            return { status: 'sent', txid, fee: precomposedTransaction.fee };
        } finally {
            // A broadcast can outlive its modal while the next transaction starts its review.
            if (selectYieldTxReview(getState()).precomposedForm === precomposedForm) {
                dispatch(yieldActions.discardTransaction());
            }
        }
    } finally {
        simulation.resolve();
    }
};

type SendEvmTokenTransactionParams = Omit<SendEvmTransactionParams, 'prepareReview'> & {
    amount: string;
    token: YieldFlowDisplayToken;
    unsignedTransaction: string;
};

export const sendEvmTokenTransaction = ({
    amount,
    token,
    unsignedTransaction,
    ...params
}: SendEvmTokenTransactionParams) =>
    sendEvmTransaction({
        ...params,
        prepareReview: ({ selectedFee, selectedFeeLevel }) =>
            buildStablecoinYieldTransactionReview({
                unsignedTransaction,
                selectedFee,
                selectedFeeLevel,
                amount,
                token,
                symbol: params.account.symbol,
            }),
    });
