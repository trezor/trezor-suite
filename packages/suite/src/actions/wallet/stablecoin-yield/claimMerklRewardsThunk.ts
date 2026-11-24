import { type DesktopAnalyticsDep } from '@suite/analytics';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import {
    buildClaimCalldata,
    buildClaimTransactionReview,
    buildUnsignedClaimTransaction,
} from '@suite-common/earn-stablecoin';
import { type YieldAccountsRewards } from '@suite-common/earn-stablecoin-api';
import { getEarnYieldClaimContractAddress, getNetwork } from '@suite-common/wallet-config';
import {
    type EthereumGetCurrentNonceThunkState,
    type SynchronizeSentTransactionThunkDeps,
    YIELD_PREFIX,
    type YieldEstimatedFeeLevel,
    estimateYieldFeeLevel,
    getYieldClaimRewardsSnapshot,
    isEarnSigningCancelled,
    notifyEarnTransactionBroadcastThunk,
    selectAddressDisplayType,
    synchronizeSentTransactionThunk,
    transactionsActions,
    yieldActions,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import {
    PUSH_TRANSACTION_FAILED_CAUSE,
    type SendYieldTransactionState,
    getYieldSubmitErrorAnalyticsMessage,
    isYieldSigningDevice,
    openYieldSimulationThunk,
    pushYieldTransaction,
    showYieldSubmitErrorThunk,
} from './signingHelpers';

type ClaimMerklReward = YieldAccountsRewards[number]['rewards'][number];

const getClaimFee = (feeLevel: YieldEstimatedFeeLevel) => {
    const gasLimit = feeLevel.feeLimit;

    const eip1559MediumFee = feeLevel.eip1559?.medium;

    if (eip1559MediumFee?.maxFeePerGas && eip1559MediumFee?.maxPriorityFeePerGas) {
        return {
            maxFeePerGas: eip1559MediumFee.maxFeePerGas,
            maxPriorityFeePerGas: eip1559MediumFee.maxPriorityFeePerGas,
            baseFeePerGas: feeLevel.eip1559?.baseFeePerGas,
            gasLimit,
        };
    }

    return {
        gasPrice: feeLevel.feePerUnit,
        gasLimit,
    };
};

type ClaimMerklRewardsParams = {
    account: Account;
    flowKey: string;
    rewards: ClaimMerklReward[];
};

type ClaimMerklRewardsThunkState = EthereumGetCurrentNonceThunkState & SendYieldTransactionState;

type ClaimMerklRewardsThunkDeps = SynchronizeSentTransactionThunkDeps & {
    services: DesktopAnalyticsDep;
};

export const claimMerklRewardsThunk = createThunk<
    { txid: string } | null | undefined,
    ClaimMerklRewardsParams,
    { state: ClaimMerklRewardsThunkState; extra: ClaimMerklRewardsThunkDeps }
>(
    `${YIELD_PREFIX}/thunk/claimMerklRewards`,
    async ({ account, flowKey, rewards }, { dispatch, getState, extra }) => {
        const device = selectSelectedDevice(getState());
        const addressDisplayType = selectAddressDisplayType(getState());

        if (!device) {
            throw new Error('Device not found.');
        }

        if (account.networkType !== 'ethereum') {
            throw new Error('Yield claim currently supports only EVM accounts.');
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            throw new Error('Chain ID not found for network.');
        }

        const merklXyzContractAddress = getEarnYieldClaimContractAddress(network.symbol);

        if (!merklXyzContractAddress) {
            throw new Error('Merkl.xyz contract address not found for network.');
        }

        const reportSubmitError = (errorMessage = 'submit-failed') =>
            extra.services.analytics.report({
                type: events.yieldClaimEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: account.symbol,
                    rewardCount: rewards.length,
                    errorMessage,
                },
            });

        dispatch(
            yieldActions.startSubmittingAction({
                flowType: 'claim',
                flowKey,
                amount: '',
            }),
        );

        try {
            const claimCalldata = buildClaimCalldata({
                senderAddress: account.descriptor,
                rewards,
            });

            const estimatedFeeLevelTask = estimateYieldFeeLevel({
                coin: account.symbol,
                identity: account.deviceState,
                from: account.descriptor,
                to: merklXyzContractAddress,
                data: claimCalldata,
            });

            const nonceTask = dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account,
                    fetchConfirmedNonce: true,
                }),
            ).unwrap();

            const [estimatedFeeLevel, { nonce }] = await Promise.all([
                estimatedFeeLevelTask,
                nonceTask,
            ]);

            if (!estimatedFeeLevel.success) {
                reportSubmitError(estimatedFeeLevel.error);
                dispatch(
                    yieldActions.setError({
                        flowType: 'claim',
                        flowKey,
                        error: 'TR_EARN_YIELD_ERROR_FEE_ESTIMATION',
                    }),
                );

                return;
            }

            const unsignedClaimTx = buildUnsignedClaimTransaction({
                contractAddress: merklXyzContractAddress,
                data: claimCalldata,
                chainId: network.chainId,
                fee: getClaimFee(estimatedFeeLevel.payload),
                nonce,
            });

            const userAcceptedTxSimulation = await dispatch(
                openYieldSimulationThunk(
                    {
                        flow: 'claim',
                        account,
                        unsignedTx: unsignedClaimTx,
                    },
                    device,
                ),
            );

            if (userAcceptedTxSimulation === undefined) {
                return;
            }

            extra.services.analytics.report({
                type: events.yieldClaimEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    action: userAcceptedTxSimulation.value === false ? 'cancel' : 'continue',
                    networkSymbol: account.symbol,
                    rewardCount: rewards.length,
                },
            });

            if (userAcceptedTxSimulation.value === false) {
                return;
            }

            const signingDevice = selectSelectedDevice(getState());
            if (
                !isYieldSigningDevice(signingDevice, account) ||
                signingDevice.path !== device.path
            ) {
                userAcceptedTxSimulation.resolve();

                return null;
            }

            const { formState, precomposedTransaction, availableRewards, transactionForSigning } =
                buildClaimTransactionReview({
                    unsignedTransaction: unsignedClaimTx,
                    selectedFee: userAcceptedTxSimulation.selectedFee,
                    selectedFeeLevel: userAcceptedTxSimulation.selectedFeeLevel,
                    rewards,
                });

            // The completion screen renders this snapshot instead of the live Merkl query: Merkl
            // stops returning the rewards once it has processed the claim. It is built from the
            // same frozen rewards the calldata was built from, so it cannot diverge from the
            // signed transaction when Merkl data refreshes in the background.
            dispatch(
                yieldActions.storeActionReviewData({
                    flowType: 'claim',
                    flowKey,
                    rewards: getYieldClaimRewardsSnapshot({
                        networkSymbol: account.symbol,
                        rewards,
                    }),
                    unsignedTransaction: unsignedClaimTx,
                }),
            );

            dispatch(
                yieldActions.storePrecomposedTransaction({
                    precomposedTx: precomposedTransaction,
                    // Surface the resolved nonce (decimal) so the review modal shows it like Send.
                    precomposedForm: { ...formState, ethereumNonce: nonce },
                    availableRewards,
                    accountKey: account.key,
                    flowKey,
                    flowType: 'claim',
                }),
            );

            try {
                dispatch(preserveModal());

                const signingResponse = await TrezorConnect.ethereumSignTransaction({
                    device: {
                        path: signingDevice.path,
                        instance: signingDevice.instance,
                        state: signingDevice.state,
                        useEmptyPassphrase: signingDevice.useEmptyPassphrase,
                    },
                    path: account.path,
                    transaction: transactionForSigning,
                    chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
                });

                userAcceptedTxSimulation.resolve();

                if (!signingResponse.success) {
                    dispatch(closeModal());

                    const { code } = signingResponse.error;
                    if (isEarnSigningCancelled(signingResponse.error)) {
                        extra.services.analytics.report({
                            type: events.transactionCancelEvent.name,
                            payload: {
                                txType: 'yield',
                                networkSymbol: account.symbol,
                                stage: 'signing',
                            },
                        });

                        return null;
                    }

                    throw new Error(signingResponse.error.message, { cause: code });
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
                        { devicePath: signingDevice.path, cancelWith: false },
                    ),
                );

                if (!(await reviewDecision)) {
                    extra.services.analytics.report({
                        type: events.transactionCancelEvent.name,
                        payload: {
                            txType: 'yield',
                            networkSymbol: account.symbol,
                            stage: 'review',
                        },
                    });

                    return null;
                }

                const pushResponse = await pushYieldTransaction(
                    { account, serializedTx: signingResponse.payload.serializedTx, reviewDecision },
                    dispatch,
                    getState,
                );

                if (!pushResponse.success) {
                    dispatch(
                        transactionsActions.transactionBroadcastStatus({
                            account,
                            flow: 'merkl-claim',
                            status: 'error',
                        }),
                    );
                    throw new Error(pushResponse.error.message, {
                        cause: PUSH_TRANSACTION_FAILED_CAUSE,
                    });
                }

                dispatch(
                    synchronizeSentTransactionThunk({
                        selectedAccount: account,
                        precomposedTransaction,
                        precomposedForm: formState,
                        txid: pushResponse.payload.txid,
                        // The decimal nonce the claim tx was built and signed with.
                        ethereumNonce: nonce,
                    }),
                );

                dispatch(
                    notifyEarnTransactionBroadcastThunk({
                        account,
                        txid: pushResponse.payload.txid,
                        flow: 'merkl-claim',
                    }),
                );

                dispatch(
                    yieldActions.setPendingTx({
                        flowType: 'claim',
                        flowKey,
                        tx: {
                            type: 'claim',
                            txid: pushResponse.payload.txid,
                            amount: '',
                            fee: precomposedTransaction.fee,
                            submittedAt: Date.now(),
                        },
                    }),
                );

                return pushResponse.payload;
            } finally {
                dispatch(yieldActions.discardTransaction());
            }
        } catch (error) {
            console.error(error);
            reportSubmitError(getYieldSubmitErrorAnalyticsMessage(error));
            dispatch(showYieldSubmitErrorThunk({ flowType: 'claim', flowKey, error }));
        } finally {
            dispatch(yieldActions.finishSubmittingAction({ flowType: 'claim', flowKey }));
        }
    },
);
