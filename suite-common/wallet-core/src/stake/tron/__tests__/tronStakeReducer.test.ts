import { initialTronStakeState, tronStakeActions, tronStakeReducer } from '../tronStakeReducer';
import { submitTronFreezeThunk } from '../tronStakeThunks';

describe('tronStakeReducer', () => {
    it('starts on the freeze step', () => {
        expect(tronStakeReducer(undefined, { type: '@@INIT' })).toEqual(initialTronStakeState);
    });

    it('goToStep updates the step', () => {
        const state = tronStakeReducer(undefined, tronStakeActions.goToStep({ step: 'complete' }));

        expect(state.step).toBe('complete');
    });

    it('reset returns to the freeze step', () => {
        const advanced = tronStakeReducer(undefined, tronStakeActions.goToStep({ step: 'vote' }));
        const state = tronStakeReducer(advanced, tronStakeActions.reset());

        expect(state.step).toBe('freeze');
    });

    it('submit pending sets isSubmitting and clears error', () => {
        const errored = tronStakeReducer(undefined, tronStakeActions.pendingTransactionFailed());
        const state = tronStakeReducer(errored, { type: submitTronFreezeThunk.pending.type });

        expect(state.isSubmitting).toBe(true);
        expect(state.error).toBeNull();
    });

    it('submit fulfilled records pendingTxid and stops submitting (no step change yet)', () => {
        const submitting = tronStakeReducer(undefined, {
            type: submitTronFreezeThunk.pending.type,
        });
        const state = tronStakeReducer(submitting, {
            type: submitTronFreezeThunk.fulfilled.type,
            payload: { txid: 'abc123' },
        });

        expect(state.isSubmitting).toBe(false);
        expect(state.pendingTxid).toBe('abc123');
        expect(state.step).toBe('freeze');
    });

    it('submit rejected sets the error', () => {
        const state = tronStakeReducer(undefined, {
            type: submitTronFreezeThunk.rejected.type,
            payload: { kind: 'broadcast-failed' },
        });

        expect(state.isSubmitting).toBe(false);
        expect(state.error).toEqual({ kind: 'broadcast-failed' });
    });

    it('submit rejected with a cancellation does not set an error', () => {
        const submitting = tronStakeReducer(undefined, {
            type: submitTronFreezeThunk.pending.type,
        });
        const state = tronStakeReducer(submitting, {
            type: submitTronFreezeThunk.rejected.type,
            payload: { kind: 'cancelled' },
        });

        expect(state.isSubmitting).toBe(false);
        expect(state.error).toBeNull();
    });

    it('pendingTransactionConfirmed clears the txid and advances the step', () => {
        const pending = tronStakeReducer(undefined, {
            type: submitTronFreezeThunk.fulfilled.type,
            payload: { txid: 'abc123' },
        });
        const state = tronStakeReducer(pending, tronStakeActions.pendingTransactionConfirmed());

        expect(state.pendingTxid).toBeNull();
        expect(state.step).toBe('vote');
    });

    it('pendingTransactionConfirmed on the last step keeps the step', () => {
        const atComplete = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ step: 'complete' }),
        );
        const state = tronStakeReducer(atComplete, tronStakeActions.pendingTransactionConfirmed());

        expect(state.step).toBe('complete');
    });

    it('pendingTransactionFailed clears the txid and records a confirmation error', () => {
        const pending = tronStakeReducer(undefined, {
            type: submitTronFreezeThunk.fulfilled.type,
            payload: { txid: 'abc123' },
        });
        const state = tronStakeReducer(pending, tronStakeActions.pendingTransactionFailed());

        expect(state.pendingTxid).toBeNull();
        expect(state.error).toEqual({ kind: 'confirmation-failed' });
        expect(state.step).toBe('freeze');
    });
});
