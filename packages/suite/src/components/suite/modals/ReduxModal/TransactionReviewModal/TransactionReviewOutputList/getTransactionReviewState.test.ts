import { getTransactionReviewState } from './getTransactionReviewState';

describe(getTransactionReviewState.name, () => {
    it('returns "confirmed" state for signed transactions', () => {
        const state = getTransactionReviewState({
            index: 1,
            currentStep: 0,
            hasSignedTx: true,
            lastButtonRequestCode: 'ButtonRequest_SignTx',
        });
        expect(state).toBe('confirmed');
    });

    it('returns "unconfirmed" state for unsigned transactions', () => {
        const state = getTransactionReviewState({
            index: 1,
            currentStep: 0,
            hasSignedTx: false,
        });
        expect(state).toBe('unconfirmed');
    });

    it('returns "active" state for the current step', () => {
        const state = getTransactionReviewState({
            index: 1,
            currentStep: 1,
            hasSignedTx: false,
        });
        expect(state).toBe('active');
    });

    it('returns "unconfirmed" state for steps beyond the current step', () => {
        const state = getTransactionReviewState({
            index: 4,
            currentStep: 2,
            hasSignedTx: false,
        });
        expect(state).toBe('unconfirmed');
    });

    it('correctly determines output states based on review step', () => {
        const outputState = getTransactionReviewState({
            index: 0,
            currentStep: 1,
            hasSignedTx: false,
        });
        expect(outputState).toBe('confirmed');

        const outputState2 = getTransactionReviewState({
            index: 1,
            currentStep: 1,
            hasSignedTx: false,
        });
        expect(outputState2).toBe('active');

        const outputState3 = getTransactionReviewState({
            index: 2,
            currentStep: 1,
            hasSignedTx: false,
        });
        expect(outputState3).toBe('unconfirmed');
    });
});
