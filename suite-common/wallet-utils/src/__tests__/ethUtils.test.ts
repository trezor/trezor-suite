import {
    decimalToHex,
    getEvmApprovalTxData,
    getEvmTransactionTextSignature,
    hexToDecimal,
    padLeftEven,
    sanitizeHex,
    strip,
} from '../ethUtils';

describe('eth utils', () => {
    it('decimalToHex', () => {
        expect(decimalToHex(0)).toBe('0');
        expect(decimalToHex(1)).toBe('1');
        expect(decimalToHex(2)).toBe('2');
        expect(decimalToHex(100)).toBe('64');
        expect(decimalToHex(9999999999)).toBe('2540be3ff');
    });

    it('hexToDecimal', () => {
        expect(hexToDecimal(64)).toBe('100');
        expect(hexToDecimal(2)).toBe('2');
        expect(hexToDecimal(1)).toBe('1');
        expect(hexToDecimal(0)).toBe('0');
    });

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

    describe('getEvmApprovalTxData', () => {
        it('returns null if data is underfined or empty', () => {
            expect(getEvmApprovalTxData(undefined)).toBeNull();
            expect(getEvmApprovalTxData('')).toBeNull();
        });

        it('returns "approval" for approve transactions', () => {
            const approveData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // amount (32 bytes) - 1 ETH in wei

            const result = getEvmApprovalTxData(approveData);

            expect(result).toEqual({
                type: 'approval',
                spender: '0x742d35cc6634c0532925a3b8d40e592e43a73654',
                amount: '1000000000000000000',
            });
        });

        it('returns "revoke" for approve transactions with zero amount', () => {
            const revokeData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000000000000000000'; // amount (32 bytes) - 0
            const result = getEvmApprovalTxData(revokeData);

            expect(result).toEqual({
                type: 'revoke',
                spender: '0x742d35cc6634c0532925a3b8d40e592e43a73654',
                amount: '0',
            });
        });

        it('returns "approval" for maximum uint256 approval', () => {
            const maxApprovalData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // max uint256

            const result = getEvmApprovalTxData(maxApprovalData);
            expect(result?.type).toBe('approval');
        });

        it('should handle data without 0x prefix', () => {
            const dataWithoutPrefix =
                '095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            const result = getEvmApprovalTxData(dataWithoutPrefix);

            expect(result?.type).toEqual('approval');
        });

        it('should handle uppercase hex data', () => {
            const uppercaseData =
                '0X095EA7B3' +
                '000000000000000000000000742D35CC6634C0532925A3B8D40E592E43A73654' +
                '0000000000000000000000000000000000000000000000000000000000000000';

            expect(getEvmApprovalTxData(uppercaseData)?.type).toBe('revoke');
        });
    });

    describe('getEvmTransactionTextSignature', () => {
        it('should return "transfer" when data is undefined or empty string', () => {
            expect(getEvmTransactionTextSignature(undefined)).toBe('transfer');
            expect(getEvmTransactionTextSignature('')).toBe('transfer');
        });

        it('should return "transfer" for non-approval transaction data', () => {
            const randomData = '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40e5';
            expect(getEvmTransactionTextSignature(randomData)).toBe('transfer');
        });

        it('should return "approval" for approve transaction with non-zero amount', () => {
            const approveData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // amount (32 bytes) - 1 ETH in wei

            expect(getEvmTransactionTextSignature(approveData)).toBe('approval');
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

            expect(getEvmTransactionTextSignature(maxApprovalData)).toBe('approval');
        });

        it('should return "transfer" for data that starts with approve selector but is too short', () => {
            const shortData = '0x095ea7b3';
            expect(getEvmTransactionTextSignature(shortData)).toBe('transfer');
        });

        it('should return "transfer" for data that starts with approve selector but has invalid parameters', () => {
            const invalidData = '0x095ea7b3' + '000000000000000000000000742d35cc';
            expect(getEvmTransactionTextSignature(invalidData)).toBe('transfer');
        });

        it('should handle data without 0x prefix', () => {
            const dataWithoutPrefix =
                '095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(getEvmTransactionTextSignature(dataWithoutPrefix)).toBe('approval');
        });

        it('should handle uppercase hex data', () => {
            const uppercaseData =
                '0X095EA7B3' +
                '000000000000000000000000742D35CC6634C0532925A3B8D40E592E43A73654' +
                '0000000000000000000000000000000000000000000000000000000000000000';

            expect(getEvmTransactionTextSignature(uppercaseData)).toBe('revoke');
        });

        it('should return "transfer" for similar but different function selectors', () => {
            const similarData =
                '0x095ea7b4' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(getEvmTransactionTextSignature(similarData)).toBe('transfer');
        });
    });
});
