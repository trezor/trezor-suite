import { type AccountKey, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { initialTronStakeTxReview, tronStakeActions, tronStakeReducer } from '../tronStakeReducer';

const KEY = 'account-1' as AccountKey;

const PRECOMPOSED_TX = {
    type: 'final',
    totalSpent: '100',
    fee: '1',
    feePerByte: '0',
    bytes: 10,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
} as PrecomposedTransactionFinal;

describe('tronStakeReducer', () => {
    it('starts with no sessions and an empty review', () => {
        const state = tronStakeReducer(undefined, { type: '@@INIT' });

        expect(state.sessions).toEqual({});
        expect(state.txReview).toEqual(initialTronStakeTxReview);
    });

    it('goToStep updates the step for the account', () => {
        const state = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, step: 'complete' }),
        );

        expect(state.sessions[KEY]?.step).toBe('complete');
    });

    it('reset returns to the freeze step', () => {
        const advanced = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, step: 'vote' }),
        );
        const state = tronStakeReducer(advanced, tronStakeActions.reset({ accountKey: KEY }));

        expect(state.sessions[KEY]?.step).toBe('freeze');
    });

    it('submitStarted sets isSubmitting and clears error', () => {
        const errored = tronStakeReducer(
            undefined,
            tronStakeActions.pendingTransactionFailed({ accountKey: KEY }),
        );
        const state = tronStakeReducer(
            errored,
            tronStakeActions.submitStarted({ accountKey: KEY }),
        );

        expect(state.sessions[KEY]?.isSubmitting).toBe(true);
        expect(state.sessions[KEY]?.error).toBeNull();
    });

    it('submitFinished records pendingTxid and stops submitting (no step change yet)', () => {
        const submitting = tronStakeReducer(
            undefined,
            tronStakeActions.submitStarted({ accountKey: KEY }),
        );
        const state = tronStakeReducer(
            submitting,
            tronStakeActions.submitFinished({ accountKey: KEY, txid: 'abc123' }),
        );

        expect(state.sessions[KEY]?.isSubmitting).toBe(false);
        expect(state.sessions[KEY]?.pendingTxid).toBe('abc123');
        expect(state.sessions[KEY]?.step).toBe('freeze');
    });

    it('submitFinished with an error sets the error', () => {
        const state = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({
                accountKey: KEY,
                error: { kind: 'broadcast-failed' },
            }),
        );

        expect(state.sessions[KEY]?.isSubmitting).toBe(false);
        expect(state.sessions[KEY]?.error).toEqual({ kind: 'broadcast-failed' });
    });

    it('submitFinished with a cancellation does not set an error', () => {
        const submitting = tronStakeReducer(
            undefined,
            tronStakeActions.submitStarted({ accountKey: KEY }),
        );
        const state = tronStakeReducer(
            submitting,
            tronStakeActions.submitFinished({ accountKey: KEY, error: { kind: 'cancelled' } }),
        );

        expect(state.sessions[KEY]?.isSubmitting).toBe(false);
        expect(state.sessions[KEY]?.error).toBeNull();
    });

    it('pendingTransactionConfirmed clears the txid and advances the step', () => {
        const pending = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, txid: 'abc123' }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY }),
        );

        expect(state.sessions[KEY]?.pendingTxid).toBeNull();
        expect(state.sessions[KEY]?.step).toBe('vote');
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

        expect(state.sessions[KEY]?.step).toBe('complete');
    });

    it('pendingTransactionFailed clears the txid and records a confirmation error', () => {
        const pending = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, txid: 'abc123' }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.pendingTransactionFailed({ accountKey: KEY }),
        );

        expect(state.sessions[KEY]?.pendingTxid).toBeNull();
        expect(state.sessions[KEY]?.error).toEqual({ kind: 'confirmation-failed' });
        expect(state.sessions[KEY]?.step).toBe('freeze');
    });

    it('keeps sessions isolated per account', () => {
        const KEY2 = 'account-2' as AccountKey;
        const pending = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, txid: 'abc123' }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.goToStep({ accountKey: KEY2, step: 'vote' }),
        );

        expect(state.sessions[KEY]?.pendingTxid).toBe('abc123');
        expect(state.sessions[KEY2]?.pendingTxid).toBeNull();
        expect(state.sessions[KEY2]?.step).toBe('vote');
    });

    it('stores and discards the transaction review payload', () => {
        const form = { outputs: [] } as never;
        const stored = tronStakeReducer(
            undefined,
            tronStakeActions.storePrecomposedTransaction({
                precomposedTx: PRECOMPOSED_TX,
                precomposedForm: form,
                accountKey: KEY,
            }),
        );

        expect(stored.txReview.precomposedTx).toBe(PRECOMPOSED_TX);
        expect(stored.txReview.precomposedForm).toBe(form);
        expect(stored.txReview.accountKey).toBe(KEY);
        expect(stored.txReview.serializedTx).toBeUndefined();

        const signed = tronStakeReducer(
            stored,
            tronStakeActions.storeSignedTransaction({
                serializedTx: { tx: '0xdead', symbol: 'trx' },
            }),
        );

        expect(signed.txReview.serializedTx).toEqual({ tx: '0xdead', symbol: 'trx' });

        const discarded = tronStakeReducer(signed, tronStakeActions.discardTransaction());

        expect(discarded.txReview).toEqual(initialTronStakeTxReview);
    });
});
