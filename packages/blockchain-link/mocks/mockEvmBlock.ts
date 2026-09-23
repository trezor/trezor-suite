import type { Block } from 'viem';

const HASH = '0x3333333333333333333333333333333333333333333333333333333333333333';

export const mockEvmBlock = (block: Partial<Block<bigint, false>> = {}): Block<bigint, false> => ({
    hash: HASH,
    number: 42n,
    timestamp: 1700000000n,
    parentHash: HASH,
    miner: '0x0000000000000000000000000000000000000000',
    nonce: '0x0000000000000000',
    mixHash: HASH,
    sha3Uncles: HASH,
    stateRoot: HASH,
    receiptsRoot: HASH,
    transactionsRoot: HASH,
    logsBloom: '0x',
    extraData: '0x',
    baseFeePerGas: 1n,
    blobGasUsed: 0n,
    excessBlobGas: 0n,
    difficulty: 0n,
    totalDifficulty: null,
    gasLimit: 30000000n,
    gasUsed: 21000n,
    size: 1000n,
    sealFields: [],
    transactions: [],
    uncles: [],
    ...block,
});
