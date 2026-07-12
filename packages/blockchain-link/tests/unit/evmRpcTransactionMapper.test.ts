import type { Block, Transaction, TransactionReceipt } from 'viem';

import { mapGetTransactionResponse } from '../../src/workers/evm-rpc/mappers/transaction';

const baseTx = {
    hash: '0xdeadbeef',
    from: '0xfrom',
    to: '0xto',
    value: 1000n,
    nonce: 7,
    gas: 21000n,
    input: '0x',
    blockHash: '0xblock',
    blockNumber: 123n,
} as unknown as Transaction;

const baseReceipt = {
    status: 'success',
    gasUsed: 21000n,
    effectiveGasPrice: 5n,
} as unknown as TransactionReceipt;

const block = { timestamp: 42n } as unknown as Block;

describe('mapGetTransactionResponse fee', () => {
    // Regression: EIP-1559 (type-2) transactions have `tx.gasPrice === undefined`; the actual price
    // paid lives in the receipt's `effectiveGasPrice`. Deriving the fee from `tx.gasPrice` produced 0.
    it('derives the fee from receipt.effectiveGasPrice for an EIP-1559 tx', () => {
        const tx = { ...baseTx, gasPrice: undefined } as unknown as Transaction;

        const { payload } = mapGetTransactionResponse({ tx, receipt: baseReceipt, block });

        expect(payload.fee).toBe('105000'); // 21000 * 5
        expect(payload.ethereumSpecific?.gasPrice).toBe('5');
    });

    it('still uses effectiveGasPrice for a legacy tx', () => {
        const tx = { ...baseTx, gasPrice: 5n } as unknown as Transaction;

        const { payload } = mapGetTransactionResponse({ tx, receipt: baseReceipt, block });

        expect(payload.fee).toBe('105000');
    });
});
