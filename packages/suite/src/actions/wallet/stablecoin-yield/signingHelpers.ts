import { fromWei } from 'web3-utils';

import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import { flattenEvmFees, parseEvmFeeHex } from '@suite-common/schemas/src/evm';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    selectAddressDisplayType,
    stablecoinYieldActions,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type EvmSelectedFee,
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldFormMetadata,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getAccountIdentity,
    getContractAddressForNetworkSymbol,
    strip,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumSignTransaction, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import type { AppState, Dispatch } from 'src/types/suite';

const serializeNonce = (nonce: number | `0x${string}`) =>
    typeof nonce === 'number' ? `0x${nonce.toString(16)}` : nonce;

export type ParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

export const evmHexToBigNumber = (hex: `0x${string}`) => new BigNumber(strip(hex), 16);

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

export const buildYieldReviewState = ({
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
    const amountSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: token.decimals,
    });

    const eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > =
        tx.maxFeePerGas && tx.maxPriorityFeePerGas
            ? {
                  maxFeePerGas: fromWei(evmHexToBigNumber(tx.maxFeePerGas).toFixed(0), 'gwei'),
                  maxPriorityFeePerGas: fromWei(
                      evmHexToBigNumber(tx.maxPriorityFeePerGas).toFixed(0),
                      'gwei',
                  ),
              }
            : {};

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
        totalSpent: reviewToken ? amountSubunits.toFixed(0) : amountSubunits.plus(fee).toFixed(0),
        bytes: 0,
        inputs: [],
        outputs: [
            {
                address: tx.to,
                amount: amountSubunits.toFixed(0),
            },
        ],
        outputsPermutation: [0],
        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
        ...eip1559ReviewFields,
    };

    return { formState, precomposedTransaction };
};

export type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    unsignedTransaction: string;
    flowType: YieldFormMetadata['type'];
    vaultName: string;
    dispatch: Dispatch;
    getState: () => AppState;
    selectedFee: EvmSelectedFee | null;
};

export const sendYieldTransaction = async ({
    account,
    amount,
    token,
    unsignedTransaction,
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

    const parsedTx = parseUnsignedEvmTransactionForSigning(unsignedTransaction);

    if (!parsedTx) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const parsedSelectedFee = parseEvmFeeHex(selectedFee ?? parsedTx);

    if (!parsedSelectedFee) {
        throw new Error('Fee information is missing for the transaction.');
    }

    const unknownEvmFee = flattenEvmFees(parsedSelectedFee);

    const tx = {
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
