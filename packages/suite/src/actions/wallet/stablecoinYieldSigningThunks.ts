import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectAddressDisplayType } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type TransactionDto,
    type UnsignedEvmTransactionForSigning,
    submitTransactionHash,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowDisplayToken,
    type YieldSessionDataAmountPayload,
    getApprovalRequestAmount,
    getYieldActionReviewState,
    openYieldApproveModal,
    prepareYieldAction,
    setYieldGenericError,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type YieldFormMetadata,
} from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumSignTransaction } from '@trezor/connect';

import type { AppState, Dispatch } from 'src/types/suite';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

type EvmAccount = Extract<Account, { networkType: 'ethereum' }>;

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    transaction: TransactionDto;
    flowType: YieldFormMetadata['type'];
    vaultName: string;
    dispatch: Dispatch;
    getState: () => AppState;
};

const getTransactionForSigning = (
    parsedTransaction: UnsignedEvmTransactionForSigning,
): EthereumSignTransaction['transaction'] => {
    const commonTransactionFields = {
        to: parsedTransaction.to,
        value: parsedTransaction.value ?? '0x0',
        gasLimit: parsedTransaction.gasLimit,
        nonce: serializeNonce(parsedTransaction.nonce),
        data: parsedTransaction.data,
        chainId: parsedTransaction.chainId,
    };

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        return {
            ...commonTransactionFields,
            maxFeePerGas: parsedTransaction.maxFeePerGas,
            maxPriorityFeePerGas: parsedTransaction.maxPriorityFeePerGas,
        };
    }

    if (parsedTransaction.gasPrice) {
        return {
            ...commonTransactionFields,
            gasPrice: parsedTransaction.gasPrice,
            txType: parsedTransaction.type,
        };
    }

    throw new Error('Yield transaction gas parameters are missing.');
};

const sendYieldTransaction = async ({
    account,
    amount,
    token,
    transaction,
    flowType,
    vaultName,
    dispatch,
    getState,
}: SendYieldTransactionParams) => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!device) {
        throw new Error('Device not found.');
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const reviewState = getYieldActionReviewState({
        amount,
        token,
        symbol: account.symbol,
        transaction,
        flowType,
        vaultName,
    });

    if (!reviewState) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const transactionForSigning = getTransactionForSigning(reviewState.parsedTransaction);
    const { formState, precomposedTransaction } = reviewState;

    dispatch(
        stablecoinYieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            precomposedForm: formState,
            accountKey: account.key,
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
            path: (account as EvmAccount).path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            throw new Error(signingResponse.error.message);
        }

        dispatch(
            stablecoinYieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
            return;
        }

        const pushResponse = await TrezorConnect.pushTransaction({
            tx: signingResponse.payload.serializedTx,
            coin: account.symbol,
            identity: getAccountIdentity(account),
        });

        dispatch(closeModal());

        if (!pushResponse.success) {
            throw new Error(pushResponse.error.message);
        }

        return pushResponse.payload;
    } finally {
        dispatch(stablecoinYieldActions.discardTransaction());
    }
};

export const submitYieldActionThunk = createThunk(
    `${YIELD_THUNK_PREFIX}/submitAction`,
    async (
        { flowKey, flowType, flowData, amount }: YieldSessionDataAmountPayload,
        { dispatch, getState },
    ) => {
        const requestAmount = getApprovalRequestAmount({
            flowType,
            amount,
            flowData,
        });

        if (!requestAmount) {
            setYieldGenericError({ dispatch, flowType, flowKey });

            return;
        }

        dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

        try {
            const preparedAction = await prepareYieldAction({
                flowType,
                flowData,
                amount,
            });

            if (preparedAction.type === 'error') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            if (preparedAction.type === 'approval-required') {
                dispatch(
                    stablecoinYieldActions.setApprovalResponse({
                        flowType,
                        flowKey,
                        approvedSpender: preparedAction.approvalModalParams.spender,
                        revokeTransactions: preparedAction.transactions,
                    }),
                );
                dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));

                openYieldApproveModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount: preparedAction.requestAmount,
                    spender: preparedAction.approvalModalParams.spender,
                    transactionId: preparedAction.approvalModalParams.transactionId,
                    txType: 'approve',
                });

                return;
            }

            const reviewToken = flowType === 'withdraw' ? flowData.receiptToken : flowData.token;
            const vaultName = flowData.vault.outputToken?.name ?? flowData.vault.metadata.name;

            const result = await sendYieldTransaction({
                account: flowData.account,
                amount: preparedAction.reviewAmount,
                token: reviewToken,
                transaction: preparedAction.actionTransaction,
                flowType,
                vaultName,
                dispatch,
                getState,
            });

            if (!result) {
                return;
            }

            await submitTransactionHash(
                { transactionId: preparedAction.actionTransaction.id },
                { hash: result.txid },
            );

            dispatch(
                notificationsActions.addToast({
                    type: flowType === 'supply' ? 'tx-yield-supply' : 'tx-yield-withdraw',
                    formattedAmount: `${amount} ${flowData.token.symbol}`,
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: result.txid,
                }),
            );

            dispatch(
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: result.txid,
                        amount,
                        createdTimestamp: new Date().getTime(),
                    },
                    receiptAmount: preparedAction.receiptAmount,
                }),
            );
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
