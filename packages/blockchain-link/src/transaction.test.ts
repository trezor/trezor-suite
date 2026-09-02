import type { Block, Transaction, TransactionReceipt } from 'viem';

import { mapGetTransactionResponse } from './workers/evm-rpc/mappers/transaction';

const baseTx = {
    hash: '0xabc',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    value: 0n,
    nonce: 5,
    gas: 21000n,
    input: '0x',
    blockHash: '0xblock',
    blockNumber: 100n,
} as unknown as Transaction;

const block = { timestamp: 1720000000n } as unknown as Block;

describe('mapGetTransactionResponse (evm-rpc)', () => {
    it('uses receipt.effectiveGasPrice for the fee and exposes it', () => {
        const tx = { ...baseTx, gasPrice: 1000000000n } as Transaction;
        const receipt = {
            status: 'success',
            gasUsed: 21000n,
            effectiveGasPrice: 150000000n,
        } as unknown as TransactionReceipt;

        const { payload } = mapGetTransactionResponse({ tx, receipt, block });

        // 150000000 * 21000
        expect(payload.fee).toBe('3150000000000');
        expect(payload.ethereumSpecific?.effectiveGasPrice).toBe('150000000');
        expect(payload.ethereumSpecific?.gasPrice).toBe('1000000000');
    });

    it('falls back to the gasPrice bid when effectiveGasPrice is not positive', () => {
        const tx = { ...baseTx, gasPrice: 2000000000n } as Transaction;
        const receipt = {
            status: 'success',
            gasUsed: 21000n,
            effectiveGasPrice: 0n,
        } as unknown as TransactionReceipt;

        const { payload } = mapGetTransactionResponse({ tx, receipt, block });

        // 2000000000 * 21000
        expect(payload.fee).toBe('42000000000000');
        expect(payload.ethereumSpecific?.effectiveGasPrice).toBeUndefined();
    });
});
