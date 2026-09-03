import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { initialTronStakeTxReview, tronStakeActions, tronStakeReducer } from './tronStakingReducer';

const KEY = 'account-1' as AccountKey;
const FLOW = 'stake' as const;

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

    it('goToStep updates the step for the account flow', () => {
        const state = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, flow: FLOW, step: 'vote' }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('vote');
    });

    it('reset returns to the flow initial step', () => {
        const advanced = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, flow: FLOW, step: 'vote' }),
        );
        const state = tronStakeReducer(
            advanced,
            tronStakeActions.reset({ accountKey: KEY, flow: FLOW }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('freeze');
    });

    it('submitStarted sets isSubmitting and clears error', () => {
        const errored = tronStakeReducer(
            undefined,
            tronStakeActions.pendingTransactionFailed({ accountKey: KEY, flow: FLOW }),
        );
        const state = tronStakeReducer(
            errored,
            tronStakeActions.submitStarted({ accountKey: KEY, flow: FLOW }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.isSubmitting).toBe(true);
        expect(state.sessions[KEY]?.[FLOW]?.error).toBeNull();
    });

    it('submitFinished records pendingTxid and stops submitting (no step change yet)', () => {
        const submitting = tronStakeReducer(
            undefined,
            tronStakeActions.submitStarted({ accountKey: KEY, flow: FLOW }),
        );
        const state = tronStakeReducer(
            submitting,
            tronStakeActions.submitFinished({ accountKey: KEY, flow: FLOW, txid: 'abc123' }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.isSubmitting).toBe(false);
        expect(state.sessions[KEY]?.[FLOW]?.pendingTxid).toBe('abc123');
        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('freeze');
    });

    it('submitFinished with an error sets the error', () => {
        const state = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({
                accountKey: KEY,
                flow: FLOW,
                error: { kind: 'broadcast-failed' },
            }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.isSubmitting).toBe(false);
        expect(state.sessions[KEY]?.[FLOW]?.error).toEqual({ kind: 'broadcast-failed' });
    });

    it('submitFinished with a cancellation does not set an error', () => {
        const submitting = tronStakeReducer(
            undefined,
            tronStakeActions.submitStarted({ accountKey: KEY, flow: FLOW }),
        );
        const state = tronStakeReducer(
            submitting,
            tronStakeActions.submitFinished({
                accountKey: KEY,
                flow: FLOW,
                error: { kind: 'cancelled' },
            }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.isSubmitting).toBe(false);
        expect(state.sessions[KEY]?.[FLOW]?.error).toBeNull();
    });

    it('pendingTransactionConfirmed clears the txid and advances the step', () => {
        const pending = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, flow: FLOW, txid: 'abc123' }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY, flow: FLOW }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.pendingTxid).toBeNull();
        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('vote');
    });

    it('pendingTransactionConfirmed advances from vote to complete', () => {
        const atVote = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, flow: FLOW, step: 'vote' }),
        );
        const state = tronStakeReducer(
            atVote,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY, flow: FLOW }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('complete');
    });

    it('pendingTransactionConfirmed on the last step keeps the step', () => {
        const atComplete = tronStakeReducer(
            undefined,
            tronStakeActions.goToStep({ accountKey: KEY, flow: FLOW, step: 'complete' }),
        );
        const state = tronStakeReducer(
            atComplete,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY, flow: FLOW }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('complete');
    });

    it('pendingTransactionFailed clears the txid and records a confirmation error', () => {
        const pending = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, flow: FLOW, txid: 'abc123' }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.pendingTransactionFailed({ accountKey: KEY, flow: FLOW }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.pendingTxid).toBeNull();
        expect(state.sessions[KEY]?.[FLOW]?.error).toEqual({ kind: 'confirmation-failed' });
        expect(state.sessions[KEY]?.[FLOW]?.step).toBe('freeze');
    });

    it('keeps sessions isolated per account', () => {
        const KEY2 = 'account-2' as AccountKey;
        const pending = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, flow: FLOW, txid: 'abc123' }),
        );
        const state = tronStakeReducer(
            pending,
            tronStakeActions.goToStep({ accountKey: KEY2, flow: FLOW, step: 'vote' }),
        );

        expect(state.sessions[KEY]?.[FLOW]?.pendingTxid).toBe('abc123');
        expect(state.sessions[KEY2]?.[FLOW]?.pendingTxid).toBeNull();
        expect(state.sessions[KEY2]?.[FLOW]?.step).toBe('vote');
    });

    it('keeps flows isolated for the same account', () => {
        const staking = tronStakeReducer(
            undefined,
            tronStakeActions.submitFinished({ accountKey: KEY, flow: 'stake', txid: 'freeze-tx' }),
        );
        const state = tronStakeReducer(
            staking,
            tronStakeActions.pendingTransactionConfirmed({ accountKey: KEY, flow: 'stake' }),
        );

        // confirming the stake flow's freeze advances only the stake flow…
        expect(state.sessions[KEY]?.stake?.step).toBe('vote');
        // …the vote flow session is untouched
        expect(state.sessions[KEY]?.vote).toBeUndefined();
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
                serializedTx: { tx: '0xdead', symbol: asNetworkSymbol('trx') },
            }),
        );

        expect(signed.txReview.serializedTx).toEqual({ tx: '0xdead', symbol: 'trx' });

        const discarded = tronStakeReducer(signed, tronStakeActions.discardTransaction());

        expect(discarded.txReview).toEqual(initialTronStakeTxReview);
    });
});
