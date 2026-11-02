import { UINT256_MAX } from '@suite-common/suite-constants';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Calldata } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import {
    buildApprovalTransactionData,
    getAllowanceAction,
    getAllowanceAmount,
    getAllowanceAmountForLimit,
    getAllowanceTransactionType,
    isAllowanceUnlimited,
    shouldShowRevokeAllowanceBanner,
    tokenSupportsIncreasingAllowance,
} from './allowanceUtils';

// USDT requires resetting the allowance to zero before it can be changed.
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
// USDC supports increasing the allowance directly.
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

describe('tokenSupportsIncreasingAllowance', () => {
    it('returns false for tokens requiring an approval reset (USDT)', () => {
        expect(tokenSupportsIncreasingAllowance(USDT)).toBe(false);
        expect(tokenSupportsIncreasingAllowance(USDT.toLowerCase())).toBe(false);
        expect(tokenSupportsIncreasingAllowance(`  ${USDT}  `)).toBe(false);
    });

    it('returns true for other tokens', () => {
        expect(tokenSupportsIncreasingAllowance(USDC)).toBe(true);
    });

    it('returns false when the contract address is missing', () => {
        expect(tokenSupportsIncreasingAllowance(undefined)).toBe(false);
        expect(tokenSupportsIncreasingAllowance('')).toBe(false);
    });
});

describe('isAllowanceUnlimited', () => {
    it('treats unit amounts at or above half of UINT256_MAX (in subunits) as unlimited', () => {
        expect(isAllowanceUnlimited({ amount: '1000', decimals: 6 })).toBe(false);
        expect(
            isAllowanceUnlimited({
                amount: '115792089237316195423570985008687907853269984665640564039457',
                decimals: 18,
            }),
        ).toBe(true);
    });

    it('compares subunit amounts directly instead of scaling them again', () => {
        // Unlimited approvals are decoded as UINT256_MAX subunits.
        expect(
            isAllowanceUnlimited({
                amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                decimals: 18,
                isSubunit: true,
            }),
        ).toBe(true);

        // A large but finite approval (1e60 subunits) stays finite; without `isSubunit`
        // it would be scaled by 10^18 again and mislabeled as unlimited.
        expect(
            isAllowanceUnlimited({
                amount: `1${'0'.repeat(60)}`,
                decimals: 18,
                isSubunit: true,
            }),
        ).toBe(false);
    });
});

describe('shouldShowRevokeAllowanceBanner', () => {
    const base = {
        followedByApproval: true,
        preapprovedAmount: '100',
        approveAmount: '200',
        tokenContractAddress: USDT,
    };

    it('shows the banner when a USDT increase needs a revoke-then-approve reset', () => {
        expect(shouldShowRevokeAllowanceBanner(base)).toBe(true);
    });

    it('hides the banner when the follow-up approval lowers the limit', () => {
        expect(shouldShowRevokeAllowanceBanner({ ...base, approveAmount: '50' })).toBe(false);
    });

    it('hides the banner when the limit stays the same', () => {
        expect(shouldShowRevokeAllowanceBanner({ ...base, approveAmount: '100' })).toBe(false);
    });

    it('hides the banner for tokens that support increasing the allowance directly', () => {
        expect(shouldShowRevokeAllowanceBanner({ ...base, tokenContractAddress: USDC })).toBe(
            false,
        );
    });

    it('hides the banner for a standalone revoke (no follow-up approval)', () => {
        expect(shouldShowRevokeAllowanceBanner({ ...base, followedByApproval: false })).toBe(false);
    });

    it('hides the banner when there is no existing allowance', () => {
        expect(shouldShowRevokeAllowanceBanner({ ...base, preapprovedAmount: '0' })).toBe(false);
        expect(shouldShowRevokeAllowanceBanner({ ...base, preapprovedAmount: undefined })).toBe(
            false,
        );
    });

    it('hides the banner when the follow-up approval amount is unknown', () => {
        expect(shouldShowRevokeAllowanceBanner({ ...base, approveAmount: undefined })).toBe(false);
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
        expect(() => buildApprovalTransactionData({ amount, spender: VALID_SPENDER })).toThrow();
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

describe('getAllowanceAmount', () => {
    const token: TokenInfo = { standard: 'ERC20', contract: USDC, symbol: 'usdc', decimals: 6 };

    it('converts the requested amount to subunits for an exact approval', () => {
        expect(getAllowanceAmount({ rawAmount: '1.5', approvalType: 'MINIMAL', token })).toEqual({
            inputAmount: new BigNumber('1500000'),
            allowanceAmount: '1500000',
        });
    });

    it('uses the maximum uint256 for an unlimited approval', () => {
        const { allowanceAmount } = getAllowanceAmount({
            rawAmount: '1.5',
            approvalType: 'INFINITE',
            token,
        });

        expect(allowanceAmount).toBe(new BigNumber(UINT256_MAX).toString(10));
        expect(
            isAllowanceUnlimited({ amount: allowanceAmount, decimals: 6, isSubunit: true }),
        ).toBe(true);
    });

    it('uses zero for a revoke', () => {
        expect(
            getAllowanceAmount({ rawAmount: '1.5', approvalType: 'ZERO', token }).allowanceAmount,
        ).toBe('0');
    });
});

describe('getAllowanceAmountForLimit', () => {
    const token: TokenInfo = { standard: 'ERC20', contract: USDC, symbol: 'usdc', decimals: 6 };

    it('approves exactly the requested amount for the minimal limit', () => {
        expect(getAllowanceAmountForLimit({ amount: '1.5', limitType: 'minimal', token })).toEqual(
            getAllowanceAmount({ rawAmount: '1.5', approvalType: 'MINIMAL', token }),
        );
    });

    it('approves the maximum uint256 for the unlimited limit', () => {
        const { allowanceAmount } = getAllowanceAmountForLimit({
            amount: '1.5',
            limitType: 'unlimited',
            token,
        });

        expect(
            isAllowanceUnlimited({ amount: allowanceAmount, decimals: 6, isSubunit: true }),
        ).toBe(true);
    });
});

describe('getAllowanceTransactionType', () => {
    it('ends an approval or an increase in an approve transaction', () => {
        expect(getAllowanceTransactionType('approve')).toBe('approve');
        expect(getAllowanceTransactionType('increase')).toBe('approve');
    });

    it('ends a revoke in a revoke transaction', () => {
        expect(getAllowanceTransactionType('revoke')).toBe('revoke');
    });

    it('needs no transaction to continue with a sufficient allowance', () => {
        expect(getAllowanceTransactionType('continue')).toBeUndefined();
    });
});

describe('getAllowanceAction', () => {
    const base = {
        requestedAmount: '100',
        currentAllowanceAmount: '50',
        shouldConsiderAllowance: true,
        isRevokeRequired: false,
        tokenContractAddress: USDC,
    };

    it('asks for an approval when the existing allowance is not to be considered', () => {
        expect(getAllowanceAction({ ...base, shouldConsiderAllowance: false })).toBe('approve');
        expect(
            getAllowanceAction({
                ...base,
                shouldConsiderAllowance: false,
                currentAllowanceAmount: '1000',
            }),
        ).toBe('approve');
    });

    it('asks for an approval when there is no allowance yet', () => {
        expect(getAllowanceAction({ ...base, currentAllowanceAmount: '0' })).toBe('approve');
        expect(getAllowanceAction({ ...base, currentAllowanceAmount: null })).toBe('approve');
        expect(getAllowanceAction({ ...base, currentAllowanceAmount: undefined })).toBe('approve');
    });

    it('continues when the allowance covers the requested amount', () => {
        expect(getAllowanceAction({ ...base, currentAllowanceAmount: '100' })).toBe('continue');
        expect(getAllowanceAction({ ...base, currentAllowanceAmount: '250' })).toBe('continue');
    });

    it('continues when no amount has been entered yet and an allowance exists', () => {
        expect(getAllowanceAction({ ...base, requestedAmount: '' })).toBe('continue');
    });

    it('asks for an increase when the allowance is too low and the token can grow it', () => {
        expect(getAllowanceAction(base)).toBe('increase');
    });

    it('asks for a revoke when the allowance is too low and the token requires a reset', () => {
        expect(getAllowanceAction({ ...base, tokenContractAddress: USDT })).toBe('revoke');
    });

    it('asks for an increase when the token contract is unknown', () => {
        expect(getAllowanceAction({ ...base, tokenContractAddress: undefined })).toBe('increase');
    });

    it('asks for a revoke whenever a revoke was explicitly required', () => {
        expect(getAllowanceAction({ ...base, isRevokeRequired: true })).toBe('revoke');
        expect(
            getAllowanceAction({ ...base, isRevokeRequired: true, currentAllowanceAmount: '0' }),
        ).toBe('revoke');
    });
});
