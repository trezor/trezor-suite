import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import { flattenEvmFees, parseEvmFeeHex } from '@suite-common/schemas/src/evm';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type EvmSelectedFee,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    fromHex,
    getContractAddressForNetworkSymbol,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type EthereumSignTransaction, type TokenInfo } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

export type StablecoinYieldParsedTransactionForSigning = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

type BuildStablecoinYieldReviewTokenParams = {
    token: {
        contractAddress?: string | null;
        decimals: number;
        symbol: string;
    };
    symbol: NetworkSymbol;
};

type BuildStablecoinYieldReviewStateParams = BuildStablecoinYieldReviewTokenParams & {
    amount: string;
    tx: StablecoinYieldParsedTransactionForSigning;
};

type BuildStablecoinYieldReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

type BuildStablecoinYieldTransactionReviewParams = Omit<
    BuildStablecoinYieldReviewStateParams,
    'tx'
> & {
    selectedFee?: EvmSelectedFee | null;
    unsignedTransaction: string;
};

type BuildStablecoinYieldTransactionReviewResult = BuildStablecoinYieldReviewStateResult & {
    transactionForSigning: EthereumSignTransaction['transaction'];
};

const getStablecoinYieldTransactionWithSelectedFee = (
    parsedTransaction: StablecoinYieldParsedTransactionForSigning,
    selectedFee?: EvmSelectedFee | null,
): StablecoinYieldParsedTransactionForSigning => {
    if (!selectedFee) {
        return parsedTransaction;
    }

    const parsedSelectedFee = parseEvmFeeHex(selectedFee);

    if (!parsedSelectedFee) {
        throw new Error('Fee information is missing for the transaction.');
    }

    return {
        ...parsedTransaction,
        ...flattenEvmFees(parsedSelectedFee),
    };
};

export const getStablecoinYieldTransactionForSigning = (
    parsedTransaction: StablecoinYieldParsedTransactionForSigning,
): EthereumSignTransaction['transaction'] => {
    const commonTransactionFields = {
        to: parsedTransaction.to,
        value: parsedTransaction.value ?? '0x0',
        gasLimit: parsedTransaction.gasLimit,
        nonce: parsedTransaction.nonce,
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

const buildStablecoinYieldReviewToken = ({
    token,
    symbol,
}: BuildStablecoinYieldReviewTokenParams): TokenInfo | undefined => {
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

export const buildStablecoinYieldReviewState = ({
    tx,
    amount,
    token,
    symbol,
}: BuildStablecoinYieldReviewStateParams): BuildStablecoinYieldReviewStateResult => {
    const gasPriceHex = tx.maxFeePerGas ?? tx.gasPrice ?? '0x0';
    const gasLimit = fromHex(tx.gasLimit);
    const gasPrice = fromHex(gasPriceHex);
    const feePerUnit = fromHex(gasPriceHex).asWei().toGwei();
    const fee = gasLimit.toBigNumber().multipliedBy(gasPrice.toBigNumber());
    const reviewToken = buildStablecoinYieldReviewToken({ token, symbol });
    const amountSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: token.decimals,
    });

    const eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > =
        tx.maxFeePerGas && tx.maxPriorityFeePerGas
            ? {
                  maxFeePerGas: fromHex(tx.maxFeePerGas).asWei().toGwei(),
                  maxPriorityFeePerGas: fromHex(tx.maxPriorityFeePerGas).asWei().toGwei(),
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
        feePerUnit,
        feeLimit: gasLimit.toIntegerString(),
        ...eip1559ReviewFields,
        options: ['broadcast', 'transactionData'],
        transactionData: tx.data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: fee.toFixed(0),
        feePerByte: feePerUnit,
        feeLimit: gasLimit.toIntegerString(),
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

export const buildStablecoinYieldTransactionReview = ({
    unsignedTransaction,
    selectedFee,
    ...reviewStateParams
}: BuildStablecoinYieldTransactionReviewParams): BuildStablecoinYieldTransactionReviewResult => {
    const parsedTransaction = parseUnsignedEvmTransactionForSigning(unsignedTransaction);

    if (!parsedTransaction) {
        throw new Error('Unsupported yield transaction payload.');
    }

    const tx = getStablecoinYieldTransactionWithSelectedFee(parsedTransaction, selectedFee);

    return {
        ...buildStablecoinYieldReviewState({
            ...reviewStateParams,
            tx,
        }),
        transactionForSigning: getStablecoinYieldTransactionForSigning(tx),
    };
};
