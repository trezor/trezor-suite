import { fromWei } from 'web3-utils';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectAddressDisplayType } from '@suite/settings';
import { asEvmAddress, buildClaim } from '@suite-common/calldata';
import { selectSelectedDevice } from '@suite-common/device';
import {
    ETHEREUM_MERKL_XYZ_CONTRACT,
    type TransactionDto,
    parseUnsignedEvmTransactionForSigning,
    submitTransactionHash,
} from '@suite-common/earn-stablecoin-api';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
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
    selectStablecoinYieldTxReview,
    setYieldGenericError,
    stablecoinYieldActions,
    submitYieldOpportunity,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import {
    type Account,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldFormMetadata,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getContractAddressForNetworkSymbol,
    prepareEthereumTransaction,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumSignTransaction, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import type { MerkleRewardWithFiat } from 'src/components/earn/dashboard/yield/hooks/useMerkleRewards';
import type { AppState, Dispatch } from 'src/types/suite';

const YIELD_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

type EvmAccount = Extract<Account, { networkType: 'ethereum' }>;

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

type ParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

type BuildYieldReviewTokenParams = {
    token: YieldFlowDisplayToken;
    symbol: NetworkSymbol;
};

type BuildYieldReviewStateParams = BuildYieldReviewTokenParams & {
    parsedTransaction: ParsedTransactionForSigning;
    amount: string;
    flowType: YieldFormMetadata['type'];
    vaultName: string;
};

type BuildYieldReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
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

const toWeiString = (amount: bigint | BigNumber) =>
    typeof amount === 'bigint' ? amount.toString() : amount.toFixed(0);

const toGweiAmount = (amount: bigint | BigNumber) => fromWei(toWeiString(amount), 'gwei');

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
    parsedTransaction,
    amount,
    token,
    symbol,
    flowType,
    vaultName,
}: BuildYieldReviewStateParams): BuildYieldReviewStateResult => {
    const gasLimit = BigInt(parsedTransaction.gasLimit);
    const gasPriceWei = BigInt(
        parsedTransaction.maxFeePerGas ?? parsedTransaction.gasPrice ?? ('0x0' as `0x${string}`),
    );
    const feeWei = gasLimit * gasPriceWei;
    const reviewToken = buildYieldReviewToken({ token, symbol });
    const amountSubunits = convertAmountUnitsToSubunits(amount, token.decimals);
    let eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > = {};

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        eip1559ReviewFields = {
            maxFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxFeePerGas)),
            maxPriorityFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxPriorityFeePerGas)),
        };
    }

    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: parsedTransaction.to,
                amount,
                fiat: '',
                currency: { value: '', label: '' },
                token: reviewToken?.contract ?? null,
                dataHex: parsedTransaction.data,
            },
        ],
        selectedFee: 'custom',
        feePerUnit: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        ...eip1559ReviewFields,
        options: ['broadcast', 'transactionData'],
        transactionData: parsedTransaction.data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        yieldMetadata: { type: flowType, vaultName },
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: feeWei.toString(),
        feePerByte: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        totalSpent: reviewToken ? amountSubunits : (BigInt(amountSubunits) + feeWei).toString(),
        bytes: 0,
        inputs: [],
        outputs: [
            {
                address: parsedTransaction.to,
                amount: amountSubunits,
            },
        ],
        outputsPermutation: [0],
        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
        ...eip1559ReviewFields,
    };

    return { formState, precomposedTransaction };
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

    const parsedTransaction = parseUnsignedEvmTransactionForSigning(
        transaction.unsignedTransaction,
    );

    if (!parsedTransaction) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const transactionForSigning = getTransactionForSigning(parsedTransaction);
    const { formState, precomposedTransaction } = buildYieldReviewState({
        parsedTransaction,
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
                flowType === 'supply'
                    ? getYieldSupplyTransaction(transactions)
                    : getYieldWithdrawTransaction(transactions);

            if (!actionTransaction?.id) {
                setYieldGenericError({ dispatch, flowType, flowKey });

                return;
            }

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
                    type: flowType === 'supply' ? 'tx-yield-supply' : 'tx-yield-withdraw',
                    descriptor: flowData.account.descriptor,
                    symbol: flowData.account.symbol,
                    txid: result.txid,
                }),
            );

            const receiptAmount =
                flowType === 'supply'
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
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);

type BuildClaimReviewStateParams = {
    data: string;
    contractAddress: `0x${string}`;
    gasLimit: BigNumber;
    gasPriceWei?: BigNumber;
    maxFeePerGasWei?: BigNumber;
    maxPriorityFeePerGasWei?: BigNumber;
    baseFeePerGasWei?: BigNumber;
};

const buildClaimReviewState = ({
    data,
    contractAddress,
    gasLimit,
    gasPriceWei,
    maxFeePerGasWei,
    maxPriorityFeePerGasWei,
    baseFeePerGasWei,
}: BuildClaimReviewStateParams): BuildYieldReviewStateResult => {
    const feePriceWei = maxFeePerGasWei ?? gasPriceWei;

    if (typeof feePriceWei === 'undefined') {
        throw new Error('Fee price is missing.');
    }

    const feeWei = gasLimit.multipliedBy(feePriceWei).toFixed(0);
    let eip1559TransactionFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > = {};
    let eip1559FormFields: Pick<FormState, 'baseFeePerGas'> = {};

    if (typeof maxFeePerGasWei !== 'undefined' && typeof maxPriorityFeePerGasWei !== 'undefined') {
        eip1559TransactionFields = {
            maxFeePerGas: toGweiAmount(maxFeePerGasWei),
            maxPriorityFeePerGas: toGweiAmount(maxPriorityFeePerGasWei),
        };
        eip1559FormFields = {
            baseFeePerGas:
                typeof baseFeePerGasWei !== 'undefined'
                    ? toGweiAmount(baseFeePerGasWei)
                    : undefined,
        };
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
        feePerUnit: toGweiAmount(feePriceWei),
        feeLimit: gasLimit.toFixed(0),
        ...eip1559TransactionFields,
        ...eip1559FormFields,
        options: ['broadcast', 'transactionData'],
        transactionData: data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: feeWei,
        feePerByte: toGweiAmount(feePriceWei),
        feeLimit: gasLimit.toFixed(0),
        totalSpent: feeWei,
        bytes: 0,
        inputs: [],
        outputs: [{ address: contractAddress, amount: '0' }],
        outputsPermutation: [0],
        ...eip1559TransactionFields,
    };

    return { formState, precomposedTransaction };
};

type ClaimEstimateFeeLevel = {
    feePerUnit?: string;
    feeLimit?: string;
    eip1559?: {
        baseFeePerGas?: string;
        medium?: {
            maxFeePerGas?: string;
            maxPriorityFeePerGas?: string;
        };
    };
};

type ClaimFeeFields = {
    gasLimit: BigNumber;
    gasPriceWei?: BigNumber;
    maxFeePerGasWei?: BigNumber;
    maxPriorityFeePerGasWei?: BigNumber;
    baseFeePerGasWei?: BigNumber;
};

const getClaimFeeFields = (feeLevel: ClaimEstimateFeeLevel): ClaimFeeFields => {
    const gasLimit = new BigNumber(feeLevel.feeLimit ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT);
    const eip1559MediumFee = feeLevel.eip1559?.medium;

    if (eip1559MediumFee?.maxFeePerGas && eip1559MediumFee.maxPriorityFeePerGas) {
        return {
            gasLimit,
            maxFeePerGasWei: new BigNumber(eip1559MediumFee.maxFeePerGas),
            maxPriorityFeePerGasWei: new BigNumber(eip1559MediumFee.maxPriorityFeePerGas),
            baseFeePerGasWei: feeLevel.eip1559?.baseFeePerGas
                ? new BigNumber(feeLevel.eip1559.baseFeePerGas)
                : undefined,
        };
    }

    if (!feeLevel.feePerUnit) {
        throw new Error('Fee per unit is missing.');
    }

    return {
        gasLimit,
        gasPriceWei: new BigNumber(feeLevel.feePerUnit),
    };
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

        if (account.symbol !== 'eth') {
            throw new Error('Yield claim currently supports only Ethereum accounts.');
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            throw new Error('Chain ID not found for network.');
        }

        const merklXyzContractAddress = ETHEREUM_MERKL_XYZ_CONTRACT[network.chainId];

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

            if (!claimResult.isValid || !claimResult.data) {
                throw new Error('Failed to build claim calldata.');
            }

            const estimatedFee = await TrezorConnect.blockchainEstimateFee({
                coin: account.symbol,
                request: {
                    blocks: [2],
                    specific: {
                        from: account.descriptor,
                        to: merklXyzContractAddress,
                        data: claimResult.data,
                    },
                },
            });

            if (!estimatedFee.success) {
                throw new Error('Failed to estimate fee for claim transaction.');
            }

            const feeLevel = estimatedFee.payload.levels[0];

            if (!feeLevel) {
                throw new Error('No fee level available.');
            }

            const claimFeeFields = getClaimFeeFields(feeLevel);

            const { nonce } = await dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount: account as EvmAccount }),
            ).unwrap();

            const { formState, precomposedTransaction } = buildClaimReviewState({
                data: claimResult.data,
                contractAddress: merklXyzContractAddress,
                ...claimFeeFields,
            });

            dispatch(
                stablecoinYieldActions.storePrecomposedTransaction({
                    precomposedTx: precomposedTransaction,
                    precomposedForm: formState,
                    accountKey: account.key,
                }),
            );

            const commonTxFields = {
                to: merklXyzContractAddress,
                amount: '0',
                chainId: network.chainId,
                nonce,
                gasLimit: claimFeeFields.gasLimit.toFixed(0),
                data: claimResult.data,
            };
            const { gasPriceWei, maxFeePerGasWei, maxPriorityFeePerGasWei } = claimFeeFields;

            const hasEip1559Fees =
                maxFeePerGasWei !== undefined && maxPriorityFeePerGasWei !== undefined;

            if (!hasEip1559Fees && gasPriceWei === undefined) {
                throw new Error('Gas price is missing.');
            }

            const transactionForSigning: EthereumSignTransaction['transaction'] = hasEip1559Fees
                ? prepareEthereumTransaction({
                      ...commonTxFields,
                      maxFeePerGas: toGweiAmount(maxFeePerGasWei),
                      maxPriorityFeePerGas: toGweiAmount(maxPriorityFeePerGasWei),
                  })
                : prepareEthereumTransaction({
                      ...commonTxFields,
                      gasPrice: toGweiAmount(gasPriceWei!),
                  });

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
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType: 'claim', flowKey }));
        }
    },
);
