import { parseAbi } from 'viem';

import { createEvmEncoder } from '../../encoder/evm';

describe('createEvmEncoder', () => {
    describe('ABI validation', () => {
        it('throws when no function in ABI', () => {
            const abi = parseAbi(['event Transfer(address indexed from, address indexed to)']);

            expect(() => createEvmEncoder(abi)).toThrow('No function in ABI');
        });

        it('throws when multiple functions in ABI', () => {
            const abi = parseAbi([
                'function transfer(address to, uint256 amount)',
                'function approve(address spender, uint256 amount)',
            ]);

            expect(() => createEvmEncoder(abi)).toThrow('ABI must contain exactly one function');
        });

        it('throws when function has unnamed parameters', () => {
            const abi = parseAbi(['function transfer(address, uint256)']);

            expect(() => createEvmEncoder(abi)).toThrow(
                "ABI function 'transfer' has unnamed parameters",
            );
        });
    });

    describe('encoder', () => {
        const abi = parseAbi(['function transfer(address to, uint256 amount)']);
        const encode = createEvmEncoder(abi);

        it('encodes valid params to calldata', () => {
            const result = encode({
                to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                amount: 1000n,
            });

            expect(result).toBe(
                '0xa9059cbb000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00000000000000000000000000000000000000000000000000000000000003e8',
            );
        });

        it('throws when too few params provided', () => {
            // @ts-expect-error
            expect(() => encode({ to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })).toThrow(
                "Param count mismatch for 'transfer': expected 2, got 1",
            );
        });

        it('throws when too many params provided', () => {
            expect(() =>
                encode({
                    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    amount: 1000n,
                    // @ts-expect-error
                    extra: 'value',
                }),
            ).toThrow("Param count mismatch for 'transfer': expected 2, got 3");
        });

        it('throws when param value is null', () => {
            expect(() =>
                encode({
                    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    amount: null,
                }),
            ).toThrow("transfer: Param 'amount' cannot be null/undefined");
        });

        it('throws when param value is undefined', () => {
            expect(() =>
                encode({
                    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    amount: undefined,
                }),
            ).toThrow("transfer: Param 'amount' cannot be null/undefined");
        });
    });
});
