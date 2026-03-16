import { type FormDraftRootState } from '../formDraftSlice';
import { selectDeepCopyOfFormDraft, selectFormDraft } from '../selectors';

describe('selectors', () => {
    let state: FormDraftRootState;

    beforeEach(() => {
        state = {
            wallet: {
                formDrafts: {
                    'stake/eth': {
                        key1: 'value1',
                    },
                },
            },
        };
    });

    describe('selectFormDraft', () => {
        it('should be undefined for unknown key', () => {
            expect(selectFormDraft(state, 'unknown-key')).toBeUndefined();
        });

        it('should return form draft for known key', () => {
            expect(selectFormDraft(state, 'stake/eth')).toEqual({ key1: 'value1' });
        });

        it('should be stable', () => {
            expect(selectFormDraft(state, 'stake/eth')).toBe(selectFormDraft(state, 'stake/eth'));
        });

        it('should return state directly', () => {
            expect(selectFormDraft(state, 'stake/eth')).toBe(state.wallet.formDrafts['stake/eth']);
        });
    });

    describe('selectDeepCopyOfFormDraft', () => {
        it('should be undefined for unknown key', () => {
            expect(selectDeepCopyOfFormDraft(state, 'unknown-key')).toBeUndefined();
        });

        it('should return form draft for known key', () => {
            expect(selectDeepCopyOfFormDraft(state, 'stake/eth')).toEqual({ key1: 'value1' });
        });

        it('should be stable', () => {
            expect(selectDeepCopyOfFormDraft(state, 'stake/eth')).toBe(
                selectDeepCopyOfFormDraft(state, 'stake/eth'),
            );
        });

        it('should return copy of state', () => {
            expect(selectDeepCopyOfFormDraft(state, 'stake/eth')).not.toBe(
                state.wallet.formDrafts['stake/eth'],
            );
        });
    });
});
