import { fromWei, hexToNumberString, numberToHex } from 'web3-utils';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { Calldata, asEvmAddress } from '@suite-common/calldata';
import { selectSelectedDevice } from '@suite-common/device';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { type EvmFeeHex, type EvmHexString, parseEvmFeeHex } from '@suite-common/schemas/src/evm';
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
    stablecoinYieldActions,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import {
    type Account,
    type AccountDescriptor,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getAccountIdentity, sanitizeHex } from '@suite-common/wallet-utils';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import type { MerkleRewardWithFiat } from 'src/components/earn/dashboard/yield/hooks/useMerkleRewards';

type BuildClaimReviewStateParams = {
    data: EvmHexString;
    contractAddress: EvmHexString;
    fee: EvmFeeHex;
};

type BuildClaimReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

const buildClaimReviewState = ({
    data,
    contractAddress,
    fee,
}: BuildClaimReviewStateParams): BuildClaimReviewStateResult => {
    const feePriceWei = new BigNumber(
        hexToNumberString(fee.type === 'eip1559' ? fee.maxFeePerGas : fee.gasPrice),
    );
    const feeLimitWei = hexToNumberString(fee.gasLimit);
    const feeWei = new BigNumber(feeLimitWei).multipliedBy(feePriceWei).toFixed(0);

    const feePerUnitGwei = fromWei(feePriceWei.toFixed(0), 'gwei');
    const eip1559Fields: {
        maxFeePerGasGwei?: PrecomposedTransactionFinal['maxFeePerGas'];
        maxPriorityFeePerGasGwei?: PrecomposedTransactionFinal['maxPriorityFeePerGas'];
        baseFeePerGasGwei?: FormState['baseFeePerGas'];
    } = {};

    if (fee.type === 'eip1559') {
        Object.assign(eip1559Fields, {
            maxFeePerGasGwei: fromWei(hexToNumberString(fee.maxFeePerGas), 'gwei'),
            maxPriorityFeePerGasGwei: fromWei(hexToNumberString(fee.maxPriorityFeePerGas), 'gwei'),
            baseFeePerGasGwei: fromWei(hexToNumberString(fee.baseFeePerGas), 'gwei'),
        });
    }

    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: contractAddress,
                amount: '0',
                fiat: '',
                currency: { value: '', label: '' },
                token: null,
                dataHex: data,
            },
        ],
        selectedFee: 'custom',
        feePerUnit: feePerUnitGwei,
        feeLimit: feeLimitWei,
        maxFeePerGas: eip1559Fields.maxFeePerGasGwei,
        maxPriorityFeePerGas: eip1559Fields.maxPriorityFeePerGasGwei,
        baseFeePerGas: eip1559Fields.baseFeePerGasGwei,
        options: ['broadcast', 'transactionData'],
        transactionData: data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        bytes: 0,
        inputs: [],
        outputs: [{ address: contractAddress, amount: '0' }],
        outputsPermutation: [0],

        totalSpent: feeWei,
        fee: feeWei,
        feePerByte: feePerUnitGwei,
        feeLimit: feeLimitWei,
        maxFeePerGas: eip1559Fields.maxFeePerGasGwei,
        maxPriorityFeePerGas: eip1559Fields.maxPriorityFeePerGasGwei,
    };

    return { formState, precomposedTransaction };
};

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

    if (eip1559MediumFee && feeLevel.eip1559) {
        return {
            maxFeePerGas: eip1559MediumFee.maxFeePerGas,
            maxPriorityFeePerGas: eip1559MediumFee.maxPriorityFeePerGas,
            baseFeePerGas: feeLevel.eip1559.baseFeePerGas,
            gasLimit,
        };
    }

    return {
        gasPrice: feeLevel.feePerUnit,
        gasLimit,
    };
}

type ClaimMerkleRewardsParams = {
    account: Account;
    flowKey: string;
    rewards: MerkleRewardWithFiat[];
};

export const claimMerkleRewardsThunk = createThunk(
    `${STABLECOIN_YIELD_PREFIX}/thunk/claimMerkleRewards`,
    async ({ account, flowKey, rewards }: ClaimMerkleRewardsParams, { dispatch, getState }) => {
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
            const sender = asEvmAddress(account.descriptor);
            const claimResult = Calldata.evm.distributor.claim(
                {
                    users: rewards.map(() => sender),
                    tokens: rewards.map(reward => asEvmAddress(reward.token.address)),
                    amounts: rewards.map(reward => new BigNumber(reward.amount)),
                    proofs: rewards.map(reward => reward.proofs),
                },
                { sender },
            );

            if (!claimResult.isValid) {
                const issues = claimResult.errors.map(issue => issue.code).join(', ');
                throw new Error(`Failed to build claim calldata${issues ? `: ${issues}` : '.'}`);
            }

            const estimatedFeeTask = getEstimatedFee({
                networkSymbol: account.symbol,
                deviceState: account.deviceState,
                from: account.descriptor,
                to: merklXyzContractAddress,
                data: claimResult.data,
            });

            const nonceTask = dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount: account }),
            ).unwrap();

            const [estimatedFee, { nonce }] = await Promise.all([estimatedFeeTask, nonceTask]);

            const unsignedClaimTx = {
                to: merklXyzContractAddress,
                data: claimResult.data,
                chainId: network.chainId,
                maxPriorityFeePerGas: estimatedFee.maxPriorityFeePerGas,
                maxFeePerGas: estimatedFee.maxFeePerGas,
                gasLimit: estimatedFee.gasLimit,
                nonce,
            };

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

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const parsedSelectedFee = parseEvmFeeHex(userAcceptedTxSimulation?.selectedFee);

            if (!parsedSelectedFee) {
                throw new Error('Fee information is missing for the transaction.');
            }

            const { formState, precomposedTransaction } = buildClaimReviewState({
                data: unsignedClaimTx.data,
                contractAddress: unsignedClaimTx.to,
                fee: parsedSelectedFee,
            });

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
                    path: account.path,
                    transaction: {
                        to: unsignedClaimTx.to,
                        chainId: unsignedClaimTx.chainId,
                        value: '0x0',
                        nonce: numberToHex(unsignedClaimTx.nonce),
                        data: sanitizeHex(unsignedClaimTx.data),
                        gasLimit: parsedSelectedFee.gasLimit,
                        ...(parsedSelectedFee.type === 'eip1559'
                            ? {
                                  maxFeePerGas: parsedSelectedFee.maxFeePerGas,
                                  maxPriorityFeePerGas: parsedSelectedFee.maxPriorityFeePerGas,
                              }
                            : {
                                  gasPrice: parsedSelectedFee.gasPrice,
                              }),
                    },
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

                const isPushConfirmed = await dispatch(
                    openDeferredModal({ type: 'review-transaction' }),
                );

                if (!isPushConfirmed) {
                    return null;
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
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType: 'claim', flowKey }));
        }
    },
);
