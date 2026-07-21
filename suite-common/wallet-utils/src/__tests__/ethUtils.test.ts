import { Calldata, asEvmAddress } from '@suite-common/calldata';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    buildApprovalTransactionData,
    getEvmTransactionTextSignature,
    getNativeWrapTxKind,
    getUnwrapAmountByEthereumDataHex,
    isUnwrapNativeTx,
    isWrapNativeTx,
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

    describe('wrapped-native tx detection', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const OTHER = '0x1111111111111111111111111111111111111111';
        const DEPOSIT = '0xd0e30db0'; // WETH deposit()
        const WITHDRAW =
            '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // withdraw(1e18)
        const ERC4626_DEPOSIT =
            '0x6e553f65' + // deposit(uint256,address) — different selector, must not be treated as a wrap
            '00000000000000000000000000000000000000000000000000000000004c4b40' +
            '0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';

        const wrap = (to: string | null, data: string | null) =>
            isWrapNativeTx({ networkSymbol: 'eth', to, data });
        const unwrap = (to: string | null, data: string | null) =>
            isUnwrapNativeTx({ networkSymbol: 'eth', to, data });

        it('isWrapNativeTx detects deposit() to the wrapped-native contract', () => {
            expect(wrap(WETH, DEPOSIT)).toBe(true);
        });

        it('isWrapNativeTx ignores deposit() to a non-WETH contract (target guard)', () => {
            expect(wrap(OTHER, DEPOSIT)).toBe(false);
        });

        it('isWrapNativeTx ignores other selectors on the WETH contract', () => {
            expect(wrap(WETH, WITHDRAW)).toBe(false);
            expect(wrap(WETH, ERC4626_DEPOSIT)).toBe(false);
        });

        it('isWrapNativeTx returns false for a missing target or data', () => {
            expect(wrap(null, DEPOSIT)).toBe(false);
            expect(wrap(WETH, null)).toBe(false);
        });

        it('isUnwrapNativeTx detects withdraw() to the wrapped-native contract', () => {
            expect(unwrap(WETH, WITHDRAW)).toBe(true);
        });

        it('isUnwrapNativeTx ignores withdraw() to a non-WETH contract', () => {
            expect(unwrap(OTHER, WITHDRAW)).toBe(false);
        });

        it('isUnwrapNativeTx ignores the deposit() selector', () => {
            expect(unwrap(WETH, DEPOSIT)).toBe(false);
        });

        it('getUnwrapAmountByEthereumDataHex returns the wad amount for withdraw()', () => {
            expect(getUnwrapAmountByEthereumDataHex(WITHDRAW)).toBe('1000000000000000000');
        });

        it('getUnwrapAmountByEthereumDataHex returns null for non-withdraw data', () => {
            expect(getUnwrapAmountByEthereumDataHex(DEPOSIT)).toBe(null);
            expect(getUnwrapAmountByEthereumDataHex('0xdeadbeef')).toBe(null);
            expect(getUnwrapAmountByEthereumDataHex(undefined)).toBe(null);
        });
    });

    describe('getNativeWrapTxKind', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const OTHER = '0x1111111111111111111111111111111111111111';
        const DEPOSIT = '0xd0e30db0';
        const WITHDRAW =
            '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000';

        const tx = ({
            targets = [],
            internalTransfers = [],
            data,
        }: {
            targets?: { addresses?: string[] }[];
            internalTransfers?: { from: string }[];
            data?: string;
        }) =>
            ({
                symbol: 'eth',
                targets,
                internalTransfers,
                ethereumSpecific: data ? { data } : undefined,
            }) as unknown as WalletAccountTransaction;

        it('detects a wrap when the WETH contract is the value target', () => {
            expect(
                getNativeWrapTxKind(tx({ targets: [{ addresses: [WETH] }], data: DEPOSIT })),
            ).toBe('wrap');
        });

        it('detects an unwrap when the WETH contract is the internal ETH sender', () => {
            expect(
                getNativeWrapTxKind(tx({ internalTransfers: [{ from: WETH }], data: WITHDRAW })),
            ).toBe('unwrap');
        });

        it('ignores a deposit() to a non-WETH contract', () => {
            expect(
                getNativeWrapTxKind(tx({ targets: [{ addresses: [OTHER] }], data: DEPOSIT })),
            ).toBeUndefined();
        });

        it('ignores a WETH interaction with an unrelated selector', () => {
            expect(
                getNativeWrapTxKind(tx({ targets: [{ addresses: [WETH] }], data: '0xdeadbeef' })),
            ).toBeUndefined();
        });

        it('returns undefined without a WETH target or data', () => {
            expect(getNativeWrapTxKind(tx({}))).toBeUndefined();
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
