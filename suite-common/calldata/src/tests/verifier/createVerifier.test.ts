import { parseAbi } from 'viem';

import { BigNumber } from '@trezor/utils';

import { buildApprove } from '../../builder/evm/approve';
import { EVM_ABI } from '../../constants/evm';
import { asEvmAddress } from '../../types/evm';
import { createVerifier } from '../../verifier/createVerifier';

const SPENDER = asEvmAddress('0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae');
const SPENDER_CHECKSUMMED = asEvmAddress('0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE');
const SENDER = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const AMOUNT = 1000000n;

const approveHex = buildApprove(
    { spender: SPENDER, amount: new BigNumber(AMOUNT.toString()) },
    { sender: SENDER },
).data!;

describe('createVerifier', () => {
    describe('factory', () => {
        it('throws when ABI has no functions', () => {
            expect(() =>
                createVerifier({
                    // @ts-expect-error
                    abi: parseAbi([]),
                }),
            ).toThrow('No function in ABI');
        });

        it('throws when ABI has multiple functions', () => {
            expect(() =>
                createVerifier({ abi: parseAbi(['function foo()', 'function bar()']) }),
            ).toThrow('ABI must contain exactly one function');
        });
    });

    describe('verifier', () => {
        const verifyApprove = createVerifier({ abi: EVM_ABI.erc20.approve });

        it('returns isValid true with no issues on full match', () => {
            expect(verifyApprove(approveHex, { spender: SPENDER, amount: AMOUNT })).toEqual({
                isValid: true,
                issues: [],
            });
        });

        it('returns VALUE_MISMATCH for a single mismatched field', () => {
            expect(
                verifyApprove(approveHex, {
                    spender: '0x0000000000000000000000000000000000000001',
                    amount: AMOUNT,
                }),
            ).toEqual({
                isValid: false,
                issues: [{ code: 'VALUE_MISMATCH', field: 'spender' }],
            });
        });

        it('returns VALUE_MISMATCH for each mismatched field', () => {
            expect(
                verifyApprove(approveHex, {
                    spender: '0x0000000000000000000000000000000000000001',
                    amount: 999n,
                }),
            ).toEqual({
                isValid: false,
                issues: [
                    { code: 'VALUE_MISMATCH', field: 'spender' },
                    { code: 'VALUE_MISMATCH', field: 'amount' },
                ],
            });
        });

        it('returns isValid true when checked partial fields match even if unchecked fields differ', () => {
            expect(
                verifyApprove(approveHex, { spender: SPENDER, amount: 999n }, ['spender']),
            ).toEqual({ isValid: true, issues: [] });
        });

        it('returns VALUE_MISMATCH when checked partial field does not match', () => {
            expect(
                verifyApprove(
                    approveHex,
                    { spender: '0x0000000000000000000000000000000000000001', amount: AMOUNT },
                    ['spender'],
                ),
            ).toEqual({
                isValid: false,
                issues: [{ code: 'VALUE_MISMATCH', field: 'spender' }],
            });
        });

        it('returns SIGNATURE_MISMATCH when selector does not match', () => {
            const verifyTransfer = createVerifier({ abi: EVM_ABI.erc20.transfer });

            expect(verifyTransfer(approveHex, { to: SPENDER, amount: AMOUNT })).toEqual({
                isValid: false,
                issues: [{ code: 'SIGNATURE_MISMATCH', field: null }],
            });
        });

        it('returns DECODING_FAILED when calldata is malformed', () => {
            const malformedHex = `${approveHex.slice(0, 10)}deadbeef` as `0x${string}`;

            expect(verifyApprove(malformedHex, { spender: SPENDER, amount: AMOUNT })).toEqual({
                isValid: false,
                issues: [{ code: 'DECODING_FAILED', field: null }],
            });
        });

        it('compares addresses case-insensitively', () => {
            expect(
                verifyApprove(approveHex, { spender: SPENDER_CHECKSUMMED, amount: AMOUNT }),
            ).toEqual({ isValid: true, issues: [] });
        });
    });
});
