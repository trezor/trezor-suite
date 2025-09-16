import { FormDraftRootState } from '../formDraftSlice';
import { selectFormDraft } from '../selectors';

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
    });
});
