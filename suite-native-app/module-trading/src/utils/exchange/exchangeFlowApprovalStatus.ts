import { type ApprovalStatus } from '@suite-common/trading';
import { type ExchangeFlowApprovalStatus } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

export const isExchangeFlowApprovalStatus = (
    approvalStatus: ApprovalStatus,
): approvalStatus is ExchangeFlowApprovalStatus => {
    switch (approvalStatus) {
        case 'needs_approval':
        case 'needs_increase':
        case 'needs_revoke':
            return true;
        case 'approved':
        case 'not_needed':
        case null:
            return false;
        default:
            return exhaustive(approvalStatus);
    }
};
