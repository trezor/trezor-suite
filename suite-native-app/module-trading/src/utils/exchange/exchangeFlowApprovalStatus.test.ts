import { type ApprovalStatus } from '@suite-common/trading';

import { isExchangeFlowApprovalStatus } from './exchangeFlowApprovalStatus';

describe('isExchangeFlowApprovalStatus', () => {
    it.each<[ApprovalStatus, boolean]>([
        ['needs_approval', true],
        ['needs_increase', true],
        ['needs_revoke', true],
        ['approved', false],
        ['not_needed', false],
        [null, false],
    ])('returns %s → %s', (approvalStatus, expected) => {
        expect(isExchangeFlowApprovalStatus(approvalStatus)).toBe(expected);
    });
});
