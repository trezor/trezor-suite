import { asTypedDesktopAnalytics } from '@suite/analytics';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import {
    buildClaimCalldata,
    buildClaimTransactionReview,
    buildUnsignedClaimTransaction,
} from '@suite-common/earn-stablecoin/src/signing';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { type YieldAccountsRewards } from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getEarnYieldClaimContractAddress, getNetwork } from '@suite-common/wallet-config';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldEstimatedFeeLevel,
    estimateYieldFeeLevel,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    stablecoinYieldActions,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import {
    PUSH_TRANSACTION_FAILED_CAUSE,
    getYieldErrorTranslationKey,
    getYieldSubmitErrorAnalyticsMessage,
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

export const claimMerklRewardsThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/claimMerklRewards`,
    async (
        { account, flowKey, rewards }: ClaimMerklRewardsParams,
        { dispatch, getState, extra },
    ) => {
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
            asTypedDesktopAnalytics(extra.services.analytics).report({
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
            stablecoinYieldActions.startSubmittingAction({
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
                    stablecoinYieldActions.setError({
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
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'claim',
                        account,
                        unsignedTx: unsignedClaimTx,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.yieldClaimEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                    networkSymbol: account.symbol,
                    rewardCount: rewards.length,
                },
            });

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const { formState, precomposedTransaction, availableRewards, transactionForSigning } =
                buildClaimTransactionReview({
                    unsignedTransaction: unsignedClaimTx,
                    selectedFee: userAcceptedTxSimulation?.selectedFee,
                    rewards,
                });

            dispatch(
                stablecoinYieldActions.storePrecomposedTransaction({
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
                        path: device.path,
                        instance: device.instance,
                        state: device.state,
                        useEmptyPassphrase: device.useEmptyPassphrase,
                    },
                    path: account.path,
                    transaction: transactionForSigning,
                    chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
                });

                userAcceptedTxSimulation?.resolve();

                if (!signingResponse.success) {
                    dispatch(closeModal());

                    const { code } = signingResponse.error;
                    if (code === 'Failure_ActionCancelled' || code === 'Method_Cancel') {
                        return null;
                    }

                    throw new Error(signingResponse.error.message, { cause: code });
                }

                dispatch(
                    stablecoinYieldActions.storeSignedTransaction({
                        serializedTx: {
                            tx: signingResponse.payload.serializedTx,
                            symbol: account.symbol,
                        },
                    }),
                );

                const isPushConfirmed = await dispatch(
                    openDeferredModal({ type: 'review-transaction' }),
                );

                if (!isPushConfirmed) {
                    return null;
                }

                const isMevProtectionEnabled = selectIsMevProtectionEnabled(getState());
                const pushResponse = await TrezorConnect.pushTransaction({
                    tx: getMevProtectedTxData(
                        account.symbol,
                        signingResponse.payload.serializedTx,
                        isMevProtectionEnabled,
                    ),
                    coin: account.symbol,
                    identity: getAccountIdentity(account),
                });

                dispatch(closeModal());

                if (!pushResponse.success) {
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
                    notificationsActions.addToast({
                        type: 'tx-yield-claim',
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        txid: pushResponse.payload.txid,
                    }),
                );

                dispatch(
                    stablecoinYieldActions.setPendingTx({
                        flowType: 'claim',
                        flowKey,
                        tx: {
                            type: 'claim',
                            txid: pushResponse.payload.txid,
                            amount: '',
                        },
                    }),
                );

                return pushResponse.payload;
            } finally {
                dispatch(stablecoinYieldActions.discardTransaction());
            }
        } catch (error) {
            console.error(error);
            reportSubmitError(getYieldSubmitErrorAnalyticsMessage(error));
            dispatch(
                stablecoinYieldActions.setError({
                    flowType: 'claim',
                    flowKey,
                    error: getYieldErrorTranslationKey(error),
                }),
            );
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType: 'claim', flowKey }));
        }
    },
);
