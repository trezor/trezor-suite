import {
    isAllowanceUnlimited,
    shouldShowRevokeAllowanceBanner,
    tokenSupportsIncreasingAllowance,
} from '../allowanceUtils';

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
    it('treats values at or above half of UINT256_MAX as unlimited', () => {
        expect(isAllowanceUnlimited('1000', 6)).toBe(false);
        expect(
            isAllowanceUnlimited(
                '115792089237316195423570985008687907853269984665640564039457',
                18,
            ),
        ).toBe(true);
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
