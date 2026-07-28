import { formDraftActions, formDraftReducer } from './formDraftSlice';

describe('formDraftSlice', () => {
    describe('storeDraft', () => {
        it('should save draft to store', () => {
            const formDraftPayload = { field1: 'value1', field2: 'value2' };

            const state = formDraftReducer(
                undefined,
                formDraftActions.storeDraft({
                    key: 'draft_key',
                    formDraft: formDraftPayload,
                }),
            );

            expect(state).toEqual({ draft_key: formDraftPayload });
        });
    });

    describe('removeDraft', () => {
        it('should remove draft from store', () => {
            const initialState = {
                draft_key: { field1: 'value1', field2: 'value2' },
                another_draft: { fieldA: 'valueA' },
            };

            const state = formDraftReducer(
                initialState,
                formDraftActions.removeDraft({ key: 'draft_key' }),
            );

            expect(state).toEqual({ another_draft: { fieldA: 'valueA' } });
        });
    });
});
