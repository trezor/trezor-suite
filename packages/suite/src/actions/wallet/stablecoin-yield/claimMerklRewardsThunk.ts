import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import {
    buildClaimCalldata,
    buildClaimTransactionReview,
    buildUnsignedClaimTransaction,
} from '@suite-common/earn-stablecoin/src/signing';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { type YieldAccountsRewards } from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { type EvmHexString } from '@suite-common/schemas/src/evm';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type NetworkSymbol,
    getEarnYieldClaimContractAddress,
    getNetwork,
} from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    STABLECOIN_YIELD_PREFIX,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    stablecoinYieldActions,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import {
    type Account,
    type AccountDescriptor,
    AddressDisplayOptions,
} from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData } from '@suite-common/wallet-utils';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';

import { getYieldErrorTranslationKey } from './signingHelpers';

type ClaimMerklReward = YieldAccountsRewards[number]['rewards'][number];

interface GetEstimatedClaimFeeParams {
    networkSymbol: NetworkSymbol;
    from: AccountDescriptor;
    to: EvmHexString;
    data: EvmHexString;
    deviceState: StaticSessionId;
    value?: EvmHexString;
}

async function getEstimatedFee({
    networkSymbol,
    from,
    to,
    data,
    deviceState,
    value = '0x0',
}: GetEstimatedClaimFeeParams) {
    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: networkSymbol,
        identity: deviceState,
        request: {
            blocks: [2],
            specific: { from, to, data, value },
        },
    });

    if (!estimatedFee.success) {
        throw new Error('Failed to estimate fee for claim transaction.');
    }

    const feeLevel = estimatedFee.payload.levels[0];

    if (!feeLevel) {
        throw new Error('No fee level available.');
    }

    const gasLimit = feeLevel.feeLimit ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;
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
}

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

            const estimatedFeeTask = getEstimatedFee({
                networkSymbol: account.symbol,
                deviceState: account.deviceState,
                from: account.descriptor,
                to: merklXyzContractAddress,
                data: claimCalldata,
            });

            const nonceTask = dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount: account }),
            ).unwrap();

            const [estimatedFee, { nonce }] = await Promise.all([estimatedFeeTask, nonceTask]);

            const unsignedClaimTx = buildUnsignedClaimTransaction({
                contractAddress: merklXyzContractAddress,
                data: claimCalldata,
                chainId: network.chainId,
                fee: estimatedFee,
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
                    precomposedForm: formState,
                    availableRewards,
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
                    throw new Error(pushResponse.error.message);
                }

                dispatch(
                    synchronizeSentTransactionThunk({
                        selectedAccount: account,
                        precomposedTransaction,
                        precomposedForm: formState,
                        txid: pushResponse.payload.txid,
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
                // eslint-disable-next-line no-useless-catch
            } catch (error) {
                throw error;
            } finally {
                dispatch(stablecoinYieldActions.discardTransaction());
            }
        } catch (error) {
            console.error(error);
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.yieldClaimEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: account.symbol,
                    rewardCount: rewards.length,
                    errorMessage: 'submit-failed',
                },
            });
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
