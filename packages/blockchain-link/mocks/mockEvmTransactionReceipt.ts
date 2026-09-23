import type { TransactionReceipt } from 'viem';

import { mockEvmTransaction } from './mockEvmTransaction';

export const mockEvmTransactionReceipt = (
    receipt: Partial<TransactionReceipt> = {},
): TransactionReceipt => {
    const { hash, from, to, blockHash, blockNumber } = mockEvmTransaction();

    return {
        transactionHash: hash,
        transactionIndex: 0,
        from,
        to,
        blockHash: blockHash ?? '0x',
        blockNumber: blockNumber ?? 0n,
        contractAddress: null,
        cumulativeGasUsed: 21000n,
        gasUsed: 21000n,
        effectiveGasPrice: 3n,
        logs: [],
        logsBloom: '0x',
        status: 'success',
        type: 'legacy',
        ...receipt,
    };
};
