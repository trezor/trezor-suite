import { getApprovalStatus } from '../approvalStatusUtils';

describe('getApprovalStatus', () => {
    it('should return null when no quote is provided', () => {
        const result = getApprovalStatus(undefined);
        expect(result).toBe(null);
    });

    it('should return "approved" when quote has preapprovedStringAmount', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: false,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "needs_approval" when quote is DEX', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: true,
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

    it('should prioritize preapprovedStringAmount over isDex', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });
});
