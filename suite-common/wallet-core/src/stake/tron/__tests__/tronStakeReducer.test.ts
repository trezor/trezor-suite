import { type AccountKey } from '@suite-common/wallet-types';

import { tronStakeActions, tronStakeReducer } from '../tronStakeReducer';
import { submitTronFreezeThunk } from '../tronStakeThunks';

const KEY = 'account-1' as AccountKey;

const submitAction = (type: string, extra?: object) => ({
    type,
    meta: { arg: { account: { key: KEY } } },
    ...extra,
});

describe('tronStakeReducer', () => {
    it('starts with no sessions', () => {
        expect(tronStakeReducer(undefined, { type: '@@INIT' })).toEqual({});
    });

    it('goToStep updates the step for the account', () => {
        const state = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, step: 'complete' }),
        );

        expect(state[KEY]?.step).toBe('complete');
    });

    it('reset returns to the freeze step', () => {
        const advanced = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, step: 'vote' }),
        );
        const state = tronStakeReducer(advanced, tronStakeActions.reset({ accountKey: KEY }));

        expect(state[KEY]?.step).toBe('freeze');
    });

    it('submit pending sets isSubmitting and clears error', () => {
        const errored = tronStakeReducer(
            undefined,
            tronStakeActions.pendingTransactionFailed({ accountKey: KEY }),
        );
        const state = tronStakeReducer(errored, submitAction(submitTronFreezeThunk.pending.type));

        expect(state[KEY]?.isSubmitting).toBe(true);
        expect(state[KEY]?.error).toBeNull();
    });

    it('submit fulfilled records pendingTxid and stops submitting (no step change yet)', () => {
        const submitting = tronStakeReducer(
            undefined,
            submitAction(submitTronFreezeThunk.pending.type),
        );
        const state = tronStakeReducer(
            submitting,
            submitAction(submitTronFreezeThunk.fulfilled.type, { payload: { txid: 'abc123' } }),
        );

        expect(state[KEY]?.isSubmitting).toBe(false);
        expect(state[KEY]?.pendingTxid).toBe('abc123');
        expect(state[KEY]?.step).toBe('freeze');
    });

    it('submit rejected sets the error', () => {
        const state = tronStakeReducer(
            undefined,
            submitAction(submitTronFreezeThunk.rejected.type, {
                payload: { kind: 'broadcast-failed' },
            }),
        );

        expect(state[KEY]?.isSubmitting).toBe(false);
        expect(state[KEY]?.error).toEqual({ kind: 'broadcast-failed' });
    });

    it('submit rejected with a cancellation does not set an error', () => {
        const submitting = tronStakeReducer(
            undefined,
            submitAction(submitTronFreezeThunk.pending.type),
        );
        const state = tronStakeReducer(
            submitting,
            submitAction(submitTronFreezeThunk.rejected.type, { payload: { kind: 'cancelled' } }),
        );

        expect(state[KEY]?.isSubmitting).toBe(false);
        expect(state[KEY]?.error).toBeNull();
    });

    it('pendingTransactionConfirmed clears the txid and advances the step', () => {
        const pending = tronStakeReducer(
            undefined,
            submitAction(submitTronFreezeThunk.fulfilled.type, { payload: { txid: 'abc123' } }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY }),
        );

        expect(state[KEY]?.pendingTxid).toBeNull();
        expect(state[KEY]?.step).toBe('vote');
    });

    it('pendingTransactionConfirmed on the last step keeps the step', () => {
        const atComplete = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, step: 'complete' }),
        );
        const state = tronStakeReducer(
            atComplete,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY }),
        );

        expect(state[KEY]?.step).toBe('complete');
    });

    it('pendingTransactionFailed clears the txid and records a confirmation error', () => {
        const pending = tronStakeReducer(
            undefined,
            submitAction(submitTronFreezeThunk.fulfilled.type, { payload: { txid: 'abc123' } }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.pendingTransactionFailed({ accountKey: KEY }),
        );

        expect(state[KEY]?.pendingTxid).toBeNull();
        expect(state[KEY]?.error).toEqual({ kind: 'confirmation-failed' });
        expect(state[KEY]?.step).toBe('freeze');
    });

    it('keeps sessions isolated per account', () => {
        const KEY2 = 'account-2' as AccountKey;
        const pending = tronStakeReducer(
            undefined,
            submitAction(submitTronFreezeThunk.fulfilled.type, { payload: { txid: 'abc123' } }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.goToStep({ accountKey: KEY2, step: 'vote' }),
        );

        expect(state[KEY]?.pendingTxid).toBe('abc123');
        expect(state[KEY2]?.pendingTxid).toBeNull();
        expect(state[KEY2]?.step).toBe('vote');
    });
});
