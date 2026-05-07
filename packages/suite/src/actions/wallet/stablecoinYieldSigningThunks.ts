import { fromWei, hexToNumberString, numberToHex } from 'web3-utils';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { asEvmAddress, buildClaim } from '@suite-common/calldata';
import { selectSelectedDevice } from '@suite-common/device';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import {
    type TransactionDto,
    parseUnsignedEvmTransactionForSigning,
    submitTransactionHash,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import {
    type EvmFeeHex,
    type EvmHexString,
    flattenEvmFees,
    parseEvmFeeHex,
} from '@suite-common/schemas/src/evm';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type NetworkSymbol,
    getEarnYieldClaimContractAddress,
    getNetwork,
} from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    STABLECOIN_YIELD_PREFIX,
    type YieldFlowDisplayToken,
    type YieldSessionDataAmountPayload,
    getApprovalRequestAmount,
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldSupplyTransaction,
    getYieldWithdrawTransaction,
    openYieldApproveModal,
    selectAddressDisplayType,
    selectStablecoinYieldTxReview,
    setYieldGenericError,
    stablecoinYieldActions,
    submitYieldOpportunity,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import {
    type Account,
    type AccountDescriptor,
    AddressDisplayOptions,
    type EvmSelectedFee,
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldFormMetadata,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getContractAddressForNetworkSymbol,
    sanitizeHex,
    strip,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type EthereumSignTransaction,
    type StaticSessionId,
    type TokenInfo,
} from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import type { MerkleRewardWithFiat } from 'src/components/earn/dashboard/yield/hooks/useMerkleRewards';
import type { AppState, Dispatch } from 'src/types/suite';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

type ParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

const evmHexToBigNumber = (hex: `0x${string}`) => new BigNumber(strip(hex), 16);

type BuildYieldReviewTokenParams = {
    token: YieldFlowDisplayToken;
    symbol: NetworkSymbol;
};

type BuildYieldReviewStateParams = BuildYieldReviewTokenParams & {
    tx: ParsedTransactionForSigning;
    amount: string;
    flowType: YieldFormMetadata['type'];
    vaultName: string;
};

type BuildYieldReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

const getTransactionForSigning = (
    parsedTransaction: ParsedTransactionForSigning,
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

const buildYieldReviewToken = ({
    token,
    symbol,
}: BuildYieldReviewTokenParams): TokenInfo | undefined => {
    if (!token.contractAddress) {
        return undefined;
    }

    return {
        standard: 'ERC20',
        contract: getContractAddressForNetworkSymbol(symbol, token.contractAddress),
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.symbol,
    };
};

const buildYieldReviewState = ({
    tx,
    amount,
    token,
    symbol,
    flowType,
    vaultName,
}: BuildYieldReviewStateParams): BuildYieldReviewStateResult => {
    const gasLimit = evmHexToBigNumber(tx.gasLimit);
    const gasPrice = evmHexToBigNumber(tx.maxFeePerGas ?? tx.gasPrice ?? ('0x0' as `0x${string}`));
    const fee = gasLimit.multipliedBy(gasPrice);
    const reviewToken = buildYieldReviewToken({ token, symbol });
    const amountSubunits = convertAmountUnitsToSubunits(amount, token.decimals);
    let eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > = {};

    if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
        eip1559ReviewFields = {
            maxFeePerGas: fromWei(evmHexToBigNumber(tx.maxFeePerGas).toFixed(0), 'gwei'),
            maxPriorityFeePerGas: fromWei(
                evmHexToBigNumber(tx.maxPriorityFeePerGas).toFixed(0),
                'gwei',
            ),
        };
    }

    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: tx.to,
                amount,
                fiat: '',
                currency: { value: '', label: '' },
                token: reviewToken?.contract ?? null,
                dataHex: tx.data,
            },
        ],
        selectedFee: 'custom',
        feePerUnit: fromWei(gasPrice.toFixed(0), 'gwei'),
        feeLimit: gasLimit.toFixed(0),
        ...eip1559ReviewFields,
        options: ['broadcast', 'transactionData'],
        transactionData: tx.data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        yieldMetadata: { type: flowType, vaultName },
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: fee.toFixed(0),
        feePerByte: fromWei(gasPrice.toFixed(0), 'gwei'),
        feeLimit: gasLimit.toFixed(0),
        totalSpent: reviewToken
            ? amountSubunits
            : new BigNumber(amountSubunits).plus(fee).toFixed(0),
        bytes: 0,
        inputs: [],
        outputs: [
            {
                address: tx.to,
                amount: amountSubunits,
            },
        ],
        outputsPermutation: [0],
        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
        ...eip1559ReviewFields,
    };

    return { formState, precomposedTransaction };
};

type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    transaction: TransactionDto;
    flowType: YieldFormMetadata['type'];
    vaultName: string;
    dispatch: Dispatch;
    getState: () => AppState;
    selectedFee: EvmSelectedFee | null;
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
    selectedFee,
}: SendYieldTransactionParams) => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!device) {
        throw new Error('Device not found.');
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const parsedTx = parseUnsignedEvmTransactionForSigning(transaction.unsignedTransaction);

    if (!parsedTx) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const parsedSelectedFee = parseEvmFeeHex(selectedFee ?? parsedTx);

    if (!parsedSelectedFee) {
        throw new Error('Fee information is missing for the transaction.');
    }

    const unknownEvmFee = flattenEvmFees(parsedSelectedFee);

    const tx: ParsedTransactionForSigning = {
        ...parsedTx,
        ...unknownEvmFee,
    } satisfies ParsedTransactionForSigning;

    const transactionForSigning = getTransactionForSigning(tx);
    const { formState, precomposedTransaction } = buildYieldReviewState({
        tx,
        amount,
        token,
        symbol: account.symbol,
        flowType,
        vaultName,
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
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            throw new Error(`${signingResponse.error.code}: ${signingResponse.error.message}`);
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
            throw new Error(`${pushResponse.error.code}: ${pushResponse.error.message}`);
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction,
                precomposedForm: formState,
                txid: pushResponse.payload.txid,
            }),
        );

        return pushResponse.payload;
    } catch (error) {
        console.error(error);
        throw error;
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
            const { response, verification } = await submitYieldOpportunity({
                flowType,
                flowData,
                amount: requestAmount,
            });

            if (verification === 'failure') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const { transactions } = response.data;
            const approvalModalParams = getYieldApprovalModalParams(transactions);

            if (approvalModalParams) {
                dispatch(
                    stablecoinYieldActions.setApprovalResponse({
                        flowType,
                        flowKey,
                        approvedSpender: approvalModalParams.spender,
                        revokeTransactions: transactions,
                    }),
                );
                dispatch(stablecoinYieldActions.enterModifyMode({ flowType, flowKey }));

                openYieldApproveModal({
                    dispatch,
                    flowKey,
                    flowType,
                    flowData,
                    amount: requestAmount,
                    spender: approvalModalParams.spender,
                    transactionId: approvalModalParams.transactionId,
                    txType: 'approve',
                });

                return;
            }

            const actionTransaction =
                flowType === 'deposit'
                    ? getYieldSupplyTransaction(transactions)
                    : getYieldWithdrawTransaction(transactions);

            if (!actionTransaction?.id) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            if (typeof actionTransaction.unsignedTransaction !== 'string') {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: flowType,
                        unsignedTx: actionTransaction.unsignedTransaction,
                        account: flowData.account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;

            const isWithdraw = flowType === 'withdraw';
            const reviewAmount = isWithdraw ? requestAmount : amount;
            const reviewToken = isWithdraw ? flowData.receiptToken : flowData.token;
            const vaultName = flowData.vault.outputToken?.name ?? flowData.vault.metadata.name;

            const result = await sendYieldTransaction({
                account: flowData.account,
                amount: reviewAmount,
                token: reviewToken,
                transaction: actionTransaction,
                flowType,
                vaultName,
                dispatch,
                getState,
                selectedFee,
            });

            if (!result) {
                return;
            }

            await submitTransactionHash(
                { transactionId: actionTransaction.id },
                { hash: result.txid },
            );

            dispatch(
                notificationsActions.addToast({
                    type: flowType === 'deposit' ? 'tx-yield-supply' : 'tx-yield-withdraw',
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: result.txid,
                }),
            );

            const receiptAmount =
                flowType === 'deposit'
                    ? (getWithdrawRequestAmount({
                          networkSymbol: flowData.account.symbol,
                          amount,
                          token: flowData.token,
                          receiptToken: flowData.receiptToken,
                          pricePerShare: flowData.vault.state?.pricePerShareState?.price,
                      }) ?? amount)
                    : requestAmount;

            dispatch(
                stablecoinYieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: flowType,
                        txid: result.txid,
                        amount,
                    },
                    receiptAmount,
                }),
            );
        } catch (error) {
            console.error(error);
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);

type BuildClaimReviewStateParams = {
    data: EvmHexString;
    contractAddress: EvmHexString;
    fee: EvmFeeHex;
};

const buildClaimReviewState = ({
    data,
    contractAddress,
    fee,
}: BuildClaimReviewStateParams): BuildYieldReviewStateResult => {
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

export const cancelSignYieldTx = createThunk(
    `${YIELD_THUNK_PREFIX}/cancelSignYieldTx`,
    (_params, { dispatch, getState }) => {
        const { serializedTx } = selectStablecoinYieldTxReview(getState());

        if (!serializedTx) {
            TrezorConnect.cancel('tx-cancelled');
        }

        dispatch(closeModal());
    },
);

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
    `${YIELD_THUNK_PREFIX}/claimMerkleRewards`,
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
            const claimResult = buildClaim(
                {
                    users: rewards.map(() => sender),
                    tokens: rewards.map(reward => asEvmAddress(reward.token.address)),
                    amounts: rewards.map(reward => new BigNumber(reward.amount)),
                    proofs: rewards.map(reward => reward.proofs),
                },
                { sender },
            );

            if (!claimResult.isValid) {
                throw new Error('Failed to build claim calldata.');
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
