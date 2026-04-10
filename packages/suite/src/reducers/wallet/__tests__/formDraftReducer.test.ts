import { formDraftActions } from '@suite-common/wallet-core';

import { STORAGE } from 'src/actions/suite/constants';

import formDraftReducer from '../formDraftReducer';

describe('formDraftReducer', () => {
    const formStateMock = { field1: 'value1', field2: 'value2' };

    describe('STORAGE.LOAD', () => {
        it('should preload drafts', () => {
            const action = {
                type: STORAGE.LOAD,
                payload: {
                    formDrafts: [{ key: 'draft1', value: formStateMock }],
                },
            };

            const state = formDraftReducer(undefined, action);

            expect(state).toEqual({
                draft1: formStateMock,
            });
        });

        it.each(['blocked', 'blocking'])(
            'should do nothing on error payload with value %s',
            payload => {
                const action = {
                    type: STORAGE.LOAD,
                    payload,
                };

                const state = formDraftReducer(undefined, action);

                expect(state).toEqual({});
            },
        );
    });

    describe('@formDraft/storeDraft', () => {
        it('should delegate storeDraft action to suite-common/formDraft reducer', () => {
            const action = formDraftActions.storeDraft({
                key: 'draft1',
                formDraft: formStateMock,
            });

            const state = formDraftReducer(undefined, action);

            expect(state).toEqual({ draft1: formStateMock });
        });
    });

    describe('@formDraft/removeDraft', () => {
        it('should delegate removeDraft to suite-common/formDraft reducer', () => {
            const initialState = { draft1: formStateMock };
            const action = formDraftActions.removeDraft({ key: 'draft1' });

            const state = formDraftReducer(initialState, action);

            expect(state).toEqual({});
        });
    });
});
