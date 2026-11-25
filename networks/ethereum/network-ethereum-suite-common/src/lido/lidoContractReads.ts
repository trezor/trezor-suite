import { type Hex, decodeFunctionResult, encodeFunctionData, isHex, parseAbi } from 'viem';

const LIDO_READ_ABI = parseAbi([
    // WstETH.
    'function stEthPerToken() view returns (uint256)',
    // Lido (stETH).
    'function getCurrentStakeLimit() view returns (uint256)',
    // WithdrawalQueueERC721.
    'struct WithdrawalRequestStatus { uint256 amountOfStETH; uint256 amountOfShares; address owner; uint256 timestamp; bool isFinalized; bool isClaimed; }',
    'function getWithdrawalRequests(address owner) view returns (uint256[] requestIds)',
    'function getWithdrawalStatus(uint256[] requestIds) view returns (WithdrawalRequestStatus[] statuses)',
    'function getLastCheckpointIndex() view returns (uint256)',
    'function findCheckpointHints(uint256[] requestIds, uint256 firstIndex, uint256 lastIndex) view returns (uint256[] hintIds)',
    'function getClaimableEther(uint256[] requestIds, uint256[] hints) view returns (uint256[] claimableEthValues)',
]);

const asCallResult = (data: string): Hex => {
    if (!isHex(data)) {
        throw new Error('Expected a hex encoded call result');
    }

    return data;
};

export type LidoWithdrawalRequestStatus = {
    amountOfStETH: bigint;
    amountOfShares: bigint;
    owner: string;
    timestamp: bigint;
    isFinalized: boolean;
    isClaimed: boolean;
};

type GetWithdrawalRequestsParams = {
    owner: string;
};

type GetWithdrawalStatusParams = {
    requestIds: readonly bigint[];
};

type FindCheckpointHintsParams = {
    // Sorted in ascending order, as the queue requires.
    requestIds: readonly bigint[];
    lastCheckpointIndex: bigint;
};

type GetClaimableEtherParams = {
    // Sorted in ascending order, each with the checkpoint hint found for it.
    requestIds: readonly bigint[];
    hints: readonly bigint[];
};

/**
 * The view calls the Lido flows read, as `eth_call` data and result decoders. The caller sends the
 * call itself, so this module stays free of Connect.
 */
export const LidoContractReads = {
    stEthPerToken: {
        encode: (): Hex =>
            encodeFunctionData({ abi: LIDO_READ_ABI, functionName: 'stEthPerToken' }),
        decode: (data: string): bigint =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'stEthPerToken',
                data: asCallResult(data),
            }),
    },
    getCurrentStakeLimit: {
        encode: (): Hex =>
            encodeFunctionData({ abi: LIDO_READ_ABI, functionName: 'getCurrentStakeLimit' }),
        decode: (data: string): bigint =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'getCurrentStakeLimit',
                data: asCallResult(data),
            }),
    },
    getWithdrawalRequests: {
        encode: ({ owner }: GetWithdrawalRequestsParams): Hex => {
            if (!isHex(owner)) {
                throw new Error('Expected a hex encoded owner address');
            }

            return encodeFunctionData({
                abi: LIDO_READ_ABI,
                functionName: 'getWithdrawalRequests',
                args: [owner],
            });
        },
        decode: (data: string): readonly bigint[] =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'getWithdrawalRequests',
                data: asCallResult(data),
            }),
    },
    getWithdrawalStatus: {
        encode: ({ requestIds }: GetWithdrawalStatusParams): Hex =>
            encodeFunctionData({
                abi: LIDO_READ_ABI,
                functionName: 'getWithdrawalStatus',
                args: [requestIds],
            }),
        decode: (data: string): readonly LidoWithdrawalRequestStatus[] =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'getWithdrawalStatus',
                data: asCallResult(data),
            }),
    },
    getLastCheckpointIndex: {
        encode: (): Hex =>
            encodeFunctionData({ abi: LIDO_READ_ABI, functionName: 'getLastCheckpointIndex' }),
        decode: (data: string): bigint =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'getLastCheckpointIndex',
                data: asCallResult(data),
            }),
    },
    findCheckpointHints: {
        encode: ({ requestIds, lastCheckpointIndex }: FindCheckpointHintsParams): Hex =>
            encodeFunctionData({
                abi: LIDO_READ_ABI,
                functionName: 'findCheckpointHints',
                args: [requestIds, 1n, lastCheckpointIndex],
            }),
        decode: (data: string): readonly bigint[] =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'findCheckpointHints',
                data: asCallResult(data),
            }),
    },
    getClaimableEther: {
        encode: ({ requestIds, hints }: GetClaimableEtherParams): Hex =>
            encodeFunctionData({
                abi: LIDO_READ_ABI,
                functionName: 'getClaimableEther',
                args: [requestIds, hints],
            }),
        decode: (data: string): readonly bigint[] =>
            decodeFunctionResult({
                abi: LIDO_READ_ABI,
                functionName: 'getClaimableEther',
                data: asCallResult(data),
            }),
    },
} as const;
