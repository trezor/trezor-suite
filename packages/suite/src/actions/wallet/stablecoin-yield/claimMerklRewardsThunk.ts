import { type DesktopAnalyticsDep } from '@suite/analytics';
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
    YIELD_PREFIX,
    type YieldEstimatedFeeLevel,
    estimateYieldFeeLevel,
    getYieldClaimRewardsSnapshot,
    notifyEarnTransactionBroadcastThunk,
    transactionsActions,
    yieldActions,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import {
    type SendEvmTransactionDeps,
    type SendEvmTransactionState,
    isEvmBroadcastError,
    openEvmTransactionSimulationThunk,
    sendEvmTransaction,
} from '../evmTransaction';
import { getYieldSubmitErrorAnalyticsMessage, showYieldSubmitErrorThunk } from './signingHelpers';

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

type ClaimMerklRewardsThunkState = EthereumGetCurrentNonceThunkState & SendEvmTransactionState;

type ClaimMerklRewardsThunkDeps = SendEvmTransactionDeps & {
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
                openEvmTransactionSimulationThunk(
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

            const result = await sendEvmTransaction({
                account,
                device,
                txType: 'yield',
                yieldFlow: { flowKey, flowType: 'claim' },
                simulation: userAcceptedTxSimulation,
                prepareReview: ({ selectedFee, selectedFeeLevel }) => {
                    const review = buildClaimTransactionReview({
                        unsignedTransaction: unsignedClaimTx,
                        selectedFee,
                        selectedFeeLevel,
                        rewards,
                    });

                    // Merkl can remove the claimed rewards from its response before Suite shows
                    // completion. Use the same rewards snapshot that produced the calldata.
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

                    return review;
                },
                dispatch,
                getState,
            });

            if (result.status === 'cancelled') {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: {
                        txType: 'yield',
                        networkSymbol: account.symbol,
                        stage: result.stage,
                    },
                });

                return null;
            }

            dispatch(
                notifyEarnTransactionBroadcastThunk({
                    account,
                    txid: result.txid,
                    flow: 'merkl-claim',
                }),
            );

            dispatch(
                yieldActions.setPendingTx({
                    flowType: 'claim',
                    flowKey,
                    tx: {
                        type: 'claim',
                        txid: result.txid,
                        amount: '',
                        fee: result.fee,
                        submittedAt: Date.now(),
                    },
                }),
            );

            return { txid: result.txid };
        } catch (error) {
            if (isEvmBroadcastError(error)) {
                dispatch(
                    transactionsActions.transactionBroadcastStatus({
                        account,
                        flow: 'merkl-claim',
                        status: 'error',
                    }),
                );
            }

            console.error(error);
            reportSubmitError(getYieldSubmitErrorAnalyticsMessage(error));
            dispatch(showYieldSubmitErrorThunk({ flowType: 'claim', flowKey, error }));
        } finally {
            dispatch(yieldActions.finishSubmittingAction({ flowType: 'claim', flowKey }));
        }
    },
);
