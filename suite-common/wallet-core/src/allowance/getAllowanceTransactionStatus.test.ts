import { testMocks } from '@suite-common/test-utils';

import { getAllowanceTransactionStatus } from './getAllowanceTransactionStatus';

describe('getAllowanceTransactionStatus', () => {
    it('returns idle status for a missing transaction', () => {
        expect(getAllowanceTransactionStatus(null)).toEqual({
            isPending: false,
            isConfirmed: false,
            isFailed: false,
        });
    });

    it('returns pending status for a transaction without a block', () => {
        const transaction = testMocks.getWalletTransaction({ blockHeight: 0 });

        expect(getAllowanceTransactionStatus(transaction)).toEqual({
            isPending: true,
            isConfirmed: false,
            isFailed: false,
        });
    });

    it('returns failed status for a mined failed transaction', () => {
        const transaction = testMocks.getWalletTransaction({
            blockHeight: 700000,
            type: 'failed',
        });

        expect(getAllowanceTransactionStatus(transaction)).toEqual({
            isPending: false,
            isConfirmed: false,
            isFailed: true,
        });
    });

    it('returns confirmed status for a mined transaction', () => {
        const transaction = testMocks.getWalletTransaction({ blockHeight: 700000, type: 'sent' });

        expect(getAllowanceTransactionStatus(transaction)).toEqual({
            isPending: false,
            isConfirmed: true,
            isFailed: false,
        });
    });
});
