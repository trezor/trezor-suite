import { mockEvmBlock } from '../mocks/mockEvmBlock';
import { mockEvmTransaction } from '../mocks/mockEvmTransaction';
import { mockEvmTransactionReceipt } from '../mocks/mockEvmTransactionReceipt';
import { mapGetTransactionResponse } from './workers/evm-rpc/mappers/transaction';

const block = mockEvmBlock();

describe('mapGetTransactionResponse (evm-rpc)', () => {
    it('uses receipt.effectiveGasPrice for the fee and exposes it', () => {
        const tx = mockEvmTransaction({ gasPrice: 1000000000n });
        const receipt = mockEvmTransactionReceipt({
            gasUsed: 21000n,
            effectiveGasPrice: 150000000n,
        });

        const { payload } = mapGetTransactionResponse({ tx, receipt, block });

        // 150000000 * 21000
        expect(payload.fee).toBe('3150000000000');
        expect(payload.ethereumSpecific?.effectiveGasPrice).toBe('150000000');
        expect(payload.ethereumSpecific?.gasPrice).toBe('1000000000');
    });

    it('falls back to the gasPrice bid when effectiveGasPrice is not positive', () => {
        const tx = mockEvmTransaction({ gasPrice: 2000000000n });
        const receipt = mockEvmTransactionReceipt({ gasUsed: 21000n, effectiveGasPrice: 0n });

        const { payload } = mapGetTransactionResponse({ tx, receipt, block });

        // 2000000000 * 21000
        expect(payload.fee).toBe('42000000000000');
        expect(payload.ethereumSpecific?.effectiveGasPrice).toBeUndefined();
    });
});
