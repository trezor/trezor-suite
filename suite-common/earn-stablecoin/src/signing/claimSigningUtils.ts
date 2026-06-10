import { Calldata, asEvmAddress } from '@suite-common/calldata';
import { type EvmFeeHex, type EvmHexString, parseEvmFeeHex } from '@suite-common/schemas/src/evm';
import {
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import { evmHexToBigNumber, evmHexWeiToGwei, sanitizeHex } from '@suite-common/wallet-utils';
import { type EthereumSignTransaction } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils';

export type ClaimReward = {
    amount: string;
    proofs: string[];
    token: {
        address: string;
        symbol: string;
    };
};

type ClaimReviewReward = Pick<ClaimReward, 'token'>;

type UnsignedClaimTransactionBase = {
    to: EvmHexString;
    data: EvmHexString;
    chainId: number;
    gasLimit: string;
    nonce: string;
};

type UnsignedClaimTransactionFee =
    | {
          gasPrice: string;
          maxFeePerGas?: never;
          maxPriorityFeePerGas?: never;
      }
    | {
          gasPrice?: never;
          maxFeePerGas: string;
          maxPriorityFeePerGas: string;
      };

export type UnsignedClaimTransaction = UnsignedClaimTransactionBase & UnsignedClaimTransactionFee;

type BuildClaimCalldataParams = {
    senderAddress: string;
    rewards: ClaimReward[];
};

type BuildUnsignedClaimTransactionParams = {
    contractAddress: EvmHexString;
    data: EvmHexString;
    chainId: number;
    fee: {
        gasLimit: string;
    } & UnsignedClaimTransactionFee;
    nonce: string | number;
};

type BuildClaimReviewStateParams = {
    data: EvmHexString;
    contractAddress: EvmHexString;
    fee: EvmFeeHex;
    rewards: ClaimReviewReward[];
};

type BuildClaimReviewStateResult = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    availableRewards: YieldClaimReward[];
};

type GetClaimTransactionForSigningParams = {
    unsignedTransaction: UnsignedClaimTransaction;
    fee: EvmFeeHex;
};

type BuildClaimTransactionReviewParams = {
    unsignedTransaction: UnsignedClaimTransaction;
    selectedFee: unknown;
    rewards: ClaimReviewReward[];
};

type BuildClaimTransactionReviewResult = BuildClaimReviewStateResult & {
    transactionForSigning: EthereumSignTransaction['transaction'];
};

type ClaimEip1559Fields = {
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    baseFeePerGas?: string;
};

const getNonceHex = (nonceValue: string | number): `0x${string}` => {
    if (typeof nonceValue === 'string' && nonceValue.startsWith('0x')) {
        return nonceValue as `0x${string}`;
    }

    const nonce = new BigNumber(nonceValue);

    if (nonce.isNaN() || !nonce.isFinite()) {
        throw new Error('Claim transaction nonce is invalid.');
    }

    return `0x${nonce.toString(16)}`;
};

const getClaimFeeData = (fee: EvmFeeHex) => {
    const gasPriceHex = fee.type === 'eip1559' ? fee.maxFeePerGas : fee.gasPrice;
    const gasLimit = evmHexToBigNumber(fee.gasLimit);
    const gasPrice = evmHexToBigNumber(gasPriceHex);

    return {
        feeWei: gasLimit.multipliedBy(gasPrice).toFixed(0),
        feeLimitWei: gasLimit.toFixed(0),
        feePerUnitGwei: evmHexWeiToGwei(gasPriceHex),
        eip1559Fields: (fee.type === 'eip1559'
            ? {
                  maxFeePerGas: evmHexWeiToGwei(fee.maxFeePerGas),
                  maxPriorityFeePerGas: evmHexWeiToGwei(fee.maxPriorityFeePerGas),
                  baseFeePerGas: evmHexWeiToGwei(fee.baseFeePerGas),
              }
            : {}) satisfies ClaimEip1559Fields,
    };
};

export const buildClaimCalldata = ({ senderAddress, rewards }: BuildClaimCalldataParams) => {
    const sender = asEvmAddress(senderAddress);
    const claimResult = Calldata.evm.distributor.claim.encode(
        {
            users: rewards.map(() => sender),
            tokens: rewards.map(reward => asEvmAddress(reward.token.address)),
            amounts: rewards.map(reward => new BigNumber(reward.amount)),
            proofs: rewards.map(reward => reward.proofs),
        },
        { sender },
    );

    if (!claimResult.isValid || !claimResult.data) {
        const issues = claimResult.errors.map(issue => issue.code).join(', ');

        throw new Error(`Failed to build claim calldata${issues ? `: ${issues}` : '.'}`);
    }

    return claimResult.data;
};

export const buildUnsignedClaimTransaction = ({
    contractAddress,
    data,
    chainId,
    fee,
    nonce,
}: BuildUnsignedClaimTransactionParams): UnsignedClaimTransaction => {
    const commonFields = {
        to: contractAddress,
        data,
        chainId,
        gasLimit: fee.gasLimit,
        nonce: nonce.toString(),
    };

    if (fee.maxFeePerGas && fee.maxPriorityFeePerGas) {
        return {
            ...commonFields,
            maxFeePerGas: fee.maxFeePerGas,
            maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
        };
    }

    if (fee.gasPrice) {
        return {
            ...commonFields,
            gasPrice: fee.gasPrice,
        };
    }

    throw new Error('Fee information is missing for the transaction.');
};

export const buildClaimReviewState = ({
    data,
    contractAddress,
    fee,
    rewards,
}: BuildClaimReviewStateParams): BuildClaimReviewStateResult => {
    const { feeWei, feeLimitWei, feePerUnitGwei, eip1559Fields } = getClaimFeeData(fee);
    const availableRewards = rewards.map(reward => ({
        tokenAddress: reward.token.address,
        tokenSymbol: reward.token.symbol,
    }));

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
        maxFeePerGas: eip1559Fields.maxFeePerGas,
        maxPriorityFeePerGas: eip1559Fields.maxPriorityFeePerGas,
        baseFeePerGas: eip1559Fields.baseFeePerGas,
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
        maxFeePerGas: eip1559Fields.maxFeePerGas,
        maxPriorityFeePerGas: eip1559Fields.maxPriorityFeePerGas,
    };

    return { formState, precomposedTransaction, availableRewards };
};

export const getClaimTransactionForSigning = ({
    unsignedTransaction,
    fee,
}: GetClaimTransactionForSigningParams): EthereumSignTransaction['transaction'] => {
    const commonFields = {
        to: unsignedTransaction.to,
        chainId: unsignedTransaction.chainId,
        value: '0x0',
        nonce: getNonceHex(unsignedTransaction.nonce),
        data: sanitizeHex(unsignedTransaction.data) as `0x${string}`,
        gasLimit: fee.gasLimit,
    };

    if (fee.type === 'eip1559') {
        return {
            ...commonFields,
            maxFeePerGas: fee.maxFeePerGas,
            maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
        };
    }

    return {
        ...commonFields,
        gasPrice: fee.gasPrice,
    };
};

export const buildClaimTransactionReview = ({
    unsignedTransaction,
    selectedFee,
    rewards,
}: BuildClaimTransactionReviewParams): BuildClaimTransactionReviewResult => {
    const fee = parseEvmFeeHex(selectedFee);

    if (!fee) {
        throw new Error('Fee information is missing for the transaction.');
    }

    return {
        ...buildClaimReviewState({
            data: unsignedTransaction.data,
            contractAddress: unsignedTransaction.to,
            fee,
            rewards,
        }),
        transactionForSigning: getClaimTransactionForSigning({
            unsignedTransaction,
            fee,
        }),
    };
};
