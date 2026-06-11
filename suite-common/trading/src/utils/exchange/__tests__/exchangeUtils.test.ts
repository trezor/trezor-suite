import { type CryptoId } from 'invity-api';

import { buildApprovalTransactionData } from '@suite-common/wallet-utils';

import {
    getApprovalStatus,
    getDexEstimationData,
    requiresTokenApproval,
    tokenSupportsIncreasingAllowance,
} from '../exchangeUtils';

const USDT_CRYPTO_ID = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;
const DAI_CRYPTO_ID = 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId;

describe('requiresTokenApproval', () => {
    it('should return false when no quote is provided', () => {
        const result = requiresTokenApproval(undefined);
        expect(result).toBe(false);
    });

    it('should return false for CEX quotes', () => {
        const quote = {
            orderId: 'test-order',
            isDex: false,
            send: 'ethereum' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when sending native EVM token (ETH)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'ethereum' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when send is not specified', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return true for DEX quotes with ERC-20 tokens', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });

    it('should return true for DEX quotes with ERC-20 tokens when EIP-712 sign data is missing', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });

    it('should return true for DEX quotes with ERC-20 tokens when sign data is not EIP-712', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'slip24',
                data: {},
            } as any,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });

    it('should return false for DEX quotes with ERC-20 tokens when status is SIGN_DATA with EIP-712 data', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'eip712-typed-data' as const,
                data: {},
            },
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });
});

describe('getApprovalStatus', () => {
    it('should return null when no quote is provided', () => {
        const result = getApprovalStatus(undefined);
        expect(result).toBe(null);
    });

    it('should return "approved" when quote has preapprovedStringAmount and is not APPROVAL_REQ', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'CONFIRM' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "approved" when quote has preapprovedStringAmount !== "0" without status', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: DAI_CRYPTO_ID,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "needs_increase" when quote has preapprovedStringAmount !== "0" and status is APPROVAL_REQ', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'APPROVAL_REQ' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_increase');
    });

    it('should return "needs_revoke" when quote has preapprovedStringAmount !== "0" and status is APPROVAL_REQ and tokenSupportsIncreasingAllowance is false', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'APPROVAL_REQ' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_revoke');
    });

    it('should return "needs_approval" when preapprovedStringAmount is "0" and isDex is true', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0',
            isDex: true,
            send: DAI_CRYPTO_ID,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "needs_approval" when quote is DEX', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: true,
            send: DAI_CRYPTO_ID,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "not_needed" for regular quote', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: false,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('not_needed');
    });

    it('should return "not_needed" for quote with SIGN_DATA status and EIP-712 data', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'eip712-typed-data' as const,
                data: {},
            },
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('not_needed');
    });

    it('should return "needs_approval" for quote with SIGN_DATA status and non-EIP-712 data', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'slip24',
                data: {},
            } as any,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "needs_approval" for quote with EIP-712 data without SIGN_DATA status', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            signData: {
                type: 'eip712-typed-data' as const,
                data: {},
            },
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });
});

describe('tokenSupportsIncreasingAllowance', () => {
    it('should return false for Ethereum USDT contract address (uppercase)', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        );
        expect(result).toBe(false);
    });

    it('should return false for Ethereum USDT contract address (lowercase)', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
        );
        expect(result).toBe(false);
    });

    it('should return true for other contract addresses', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0x1234567890123456789012345678901234567890',
        );
        expect(result).toBe(true);
    });

    it('should return false for undefined contract address', () => {
        const result = tokenSupportsIncreasingAllowance(undefined);
        expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
        const result = tokenSupportsIncreasingAllowance('');
        expect(result).toBe(false);
    });
});

describe('getDexEstimationData', () => {
    const spender = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
    const approveData = buildApprovalTransactionData({ spender, amount: '9475047' });

    const buildDexTx = (data: string) => ({
        from: '0x9cd02a26cd336d0fe784fb7995f6e5c9e3776258',
        to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        data,
        value: '0',
    });

    it('returns a zero-amount revoke calldata for a needs_revoke quote (USDT with existing allowance)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            preapprovedStringAmount: '0.001',
            status: 'APPROVAL_REQ' as const,
            dexTx: buildDexTx(approveData),
        };

        const result = getDexEstimationData(quote);
        expect(result).toBe(buildApprovalTransactionData({ spender, amount: '0' }));
        expect(result).not.toBe(approveData);
    });

    it('returns dexTx.data unchanged for a needs_increase quote (standard token supports increasing)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            preapprovedStringAmount: '0.001',
            status: 'APPROVAL_REQ' as const,
            dexTx: buildDexTx(approveData),
        };

        expect(getDexEstimationData(quote)).toBe(approveData);
    });

    it('returns undefined when the quote has no dexTx', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
        };

        expect(getDexEstimationData(quote)).toBeUndefined();
    });
});
