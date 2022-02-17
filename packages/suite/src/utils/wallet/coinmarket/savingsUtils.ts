import type { SavingsTradeItemStatus } from '@suite-services/invityAPI';

export const getStatusMessage = (status: SavingsTradeItemStatus) => {
    switch (status) {
        case 'InProgress':
        case 'Pending':
            return 'TR_SAVINGS_STATUS_PENDING';
        case 'Blocked':
        case 'Cancelled':
            return 'TR_SAVINGS_STATUS_ERROR';
        case 'Completed':
            return 'TR_SAVINGS_STATUS_SUCCESS';
        default:
            return 'TR_SAVINGS_STATUS_PENDING';
    }
};
