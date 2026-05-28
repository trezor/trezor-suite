import { Calldata, asEvmAddress } from '@suite-common/calldata';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { BigNumber } from '@trezor/utils';

import {
    buildApprovalTransactionData,
    evmHexToBigNumber,
    evmHexWeiToGwei,
    getEvmTransactionTextSignature,
    padLeftEven,
    sanitizeHex,
    strip,
} from '../ethUtils';

const VALID_CLAIM_ADDRESS = asEvmAddress('0x1111111111111111111111111111111111111111');

describe('eth utils', () => {
    it('padLeftEven', () => {
        // TODO: add more tests
        expect(padLeftEven('2540be3ff')).toBe('02540be3ff');
    });

    it('sanitizeHex', () => {
        expect(sanitizeHex('0x2540be3ff')).toBe('0x02540be3ff');
        expect(sanitizeHex('1')).toBe('0x01');
        expect(sanitizeHex('2')).toBe('0x02');
        expect(sanitizeHex('100')).toBe('0x0100');
        expect(sanitizeHex('999')).toBe('0x0999');
        expect(sanitizeHex('')).toBe('');
    });

    it('strip', () => {
        expect(strip('0x')).toBe('');
        expect(strip('0x2540be3ff')).toBe('02540be3ff');
        expect(strip('2540be3ff')).toBe('02540be3ff');
    });

    it('converts EVM fee units', () => {
        expect(evmHexToBigNumber('0x5208').toFixed()).toBe('21000');
        expect(evmHexWeiToGwei('0x3b9aca00')).toBe('1');
    });

    describe('getEvmTransactionTextSignature', () => {
        it('should return "" when data is undefined or empty string', () => {
            expect(getEvmTransactionTextSignature(undefined)).toBe('');
            expect(getEvmTransactionTextSignature('')).toBe('');
        });

        it('should return "transfer" for non-approval transaction data', () => {
            const randomData = '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40e5';
            expect(getEvmTransactionTextSignature(randomData)).toBe('unknown');
        });

        it('should return "approval" for approve transaction with non-zero amount', () => {
            const approveData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // amount (32 bytes) - 1 ETH in wei

            expect(getEvmTransactionTextSignature(approveData)).toBe('approve');
        });

        it('should return "revoke" for approve transaction with zero amount', () => {
            const revokeData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000000000000000000'; // amount (32 bytes) - 0

            expect(getEvmTransactionTextSignature(revokeData)).toBe('revoke');
        });

        it('should return "approval" for maximum uint256 approval', () => {
            const maxApprovalData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // max uint256

            expect(getEvmTransactionTextSignature(maxApprovalData)).toBe('approve');
        });

        it('should return "unknown" for data that starts with approve selector but is too short', () => {
            const shortData = '0x095ea7b3';
            expect(getEvmTransactionTextSignature(shortData)).toBe('unknown');
        });

        it('should return "unknown" for data that starts with approve selector but has invalid parameters', () => {
            const invalidData = '0x095ea7b3' + '000000000000000000000000742d35cc';
            expect(getEvmTransactionTextSignature(invalidData)).toBe('unknown');
        });

        it('should handle data without 0x prefix', () => {
            const dataWithoutPrefix =
                '095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(getEvmTransactionTextSignature(dataWithoutPrefix)).toBe('approve');
        });

        it('should handle uppercase hex data', () => {
            const uppercaseData =
                '0X095EA7B3' +
                '000000000000000000000000742D35CC6634C0532925A3B8D40E592E43A73654' +
                '0000000000000000000000000000000000000000000000000000000000000000';

            expect(getEvmTransactionTextSignature(uppercaseData)).toBe('revoke');
        });

        it('should return "unknown" text signature for unknown method call', () => {
            const similarData =
                '0x095ea7b4' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(getEvmTransactionTextSignature(similarData)).toBe('unknown');
        });

        it('returns "transfer" for valid transfer call', () => {
            const data =
                '0xa9059cbb' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '00000000000000000000000000000000000000000000000000000000000003e8';
            expect(getEvmTransactionTextSignature(data)).toBe('transfer');
        });

        it('returns "unknown" for selector-only transfer (too short)', () => {
            expect(getEvmTransactionTextSignature('0xa9059cbb')).toBe('unknown');
        });

        it('returns "unknown" for "0x" input (not empty but no known selector)', () => {
            expect(getEvmTransactionTextSignature('0x')).toBe('unknown');
        });

        it('returns "unknown" for random data not matching known selectors', () => {
            const random =
                '0x12345678' +
                '0000000000000000000000001111111111111111111111111111111111111111' +
                '0000000000000000000000000000000000000000000000000000000000000001';
            expect(getEvmTransactionTextSignature(random)).toBe('unknown');
        });

        it('handles uppercase without 0x prefix for transfer', () => {
            const upperNoPrefix =
                'A9059CBB' +
                '000000000000000000000000742D35CC6634C0532925A3B8D40E592E43A73654' +
                '00000000000000000000000000000000000000000000000000000000000003E8';
            expect(getEvmTransactionTextSignature(upperNoPrefix)).toBe('transfer');
        });

        it('returns "claim" for valid distributor claim call', () => {
            const claimData = Calldata.evm.distributor.claim.encode(
                {
                    users: [VALID_CLAIM_ADDRESS],
                    tokens: [VALID_CLAIM_ADDRESS],
                    amounts: [new BigNumber(1)],
                    proofs: [[]],
                },
                { sender: VALID_CLAIM_ADDRESS },
            ).data;

            expect(getEvmTransactionTextSignature(claimData ?? undefined)).toBe('claim');
        });

        it('returns "unknown" for selector-only claim (too short)', () => {
            expect(getEvmTransactionTextSignature('0x71ee95c0')).toBe('unknown');
        });
    });

    describe('buildApprovalTransactionData', () => {
        const VALID_SPENDER = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

        it('builds correct calldata for a valid approval', () => {
            const result = buildApprovalTransactionData({
                amount: '1000000000000000000',
                spender: VALID_SPENDER,
            });

            expect(result).toBe(
                '0x095ea7b3' +
                    '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
                    '0000000000000000000000000000000000000000000000000de0b6b3a7640000',
            );
        });

        it('builds correct calldata for zero amount (revoke)', () => {
            const result = buildApprovalTransactionData({
                amount: '0',
                spender: VALID_SPENDER,
            });

            expect(result).toBe(
                '0x095ea7b3' +
                    '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
                    '0000000000000000000000000000000000000000000000000000000000000000',
            );
        });

        it('builds correct calldata for max uint256 (infinite approval)', () => {
            const maxUint256Decimal = new BigNumber(UINT256_MAX).toString(10);
            const result = buildApprovalTransactionData({
                amount: maxUint256Decimal,
                spender: VALID_SPENDER,
            });

            expect(result).toBe(
                '0x095ea7b3' +
                    '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
                    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            );
        });

        it.each([
            ['wrong length', '0x742d35cc6634c0532925a3b844bc454e4438f44'],
            ['non-hex characters', '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'],
            ['empty string', ''],
        ])('throws for invalid spender address (%s)', (_, spender) => {
            expect(() => buildApprovalTransactionData({ amount: '1000', spender })).toThrow();
        });

        it.each([
            ['negative', '-1'],
            ['non-numeric', 'abc'],
            ['decimal', '1.5'],
            ['exceeds uint256 max', new BigNumber(UINT256_MAX).plus(1).toString(10)],
        ])('throws for invalid amount (%s)', (_, amount) => {
            expect(() =>
                buildApprovalTransactionData({ amount, spender: VALID_SPENDER }),
            ).toThrow();
        });

        it('produces calldata that the calldata decoder can decode', () => {
            const amount = '1000000000000000000';
            const calldata = buildApprovalTransactionData({
                amount,
                spender: VALID_SPENDER,
            });

            const decoded = Calldata.evm.erc20.approve.decode(calldata);

            expect(decoded).not.toBeNull();
            expect(decoded?.spender).toBe(VALID_SPENDER.toLowerCase());
            expect(decoded?.amount.toString()).toBe(amount);
        });
    });
});
