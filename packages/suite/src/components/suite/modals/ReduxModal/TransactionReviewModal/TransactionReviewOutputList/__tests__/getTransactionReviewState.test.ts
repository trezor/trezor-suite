import { getTransactionReviewState } from '../getTransactionReviewState';

describe('Transaction review states', () => {
    it('should return "confirmed" state for signed transactions', () => {
        const state = getTransactionReviewState(1, 0, true, 'ButtonRequest_SignTx');
        expect(state).toBe('confirmed');
    });

    it('should return "unconfirmed" state for unsigned transactions', () => {
        const state = getTransactionReviewState(1, 0, false, null);
        expect(state).toBe('unconfirmed');
    });

    it('should return "active" state for the current step', () => {
        const state = getTransactionReviewState(1, 1, false, null);
        expect(state).toBe('active');
    });

    it('should return "unconfirmed" state for steps beyond the current step', () => {
        const state = getTransactionReviewState(2, 3, false, null);
        expect(state).toBe('unconfirmed');
    });

    it('should correctly determine output states based on review step', () => {
        const outputState = getTransactionReviewState(0, 1, false);
        expect(outputState).toBe('confirmed');

        const outputState2 = getTransactionReviewState(1, 1, false);
        expect(outputState2).toBe('active');

        const outputState3 = getTransactionReviewState(2, 1, false);
        expect(outputState3).toBe('unconfirmed');
    });
});
