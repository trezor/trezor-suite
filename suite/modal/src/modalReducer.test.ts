import { UI_EVENTS } from '@trezor/connect';

import fixtures from './__fixtures__/modalReducer';
import { MODAL_CONTEXT_NONE } from './constants';
import { closeModal, openModal } from './modalActions';
import { type State, modalReducer } from './modalReducer';

describe('modalReducer', () => {
    it('keeps the quit prompt open when a pending device call finishes', () => {
        const state = modalReducer(undefined, openModal({ type: 'auto-start-before-quit' }));

        expect(modalReducer(state, { type: UI_EVENTS.CLOSE_UI_WINDOW })).toEqual(state);
    });

    it('closes the quit prompt after an explicit response', () => {
        const state = modalReducer(undefined, openModal({ type: 'auto-start-before-quit' }));

        expect(modalReducer(state, closeModal())).toEqual({ context: MODAL_CONTEXT_NONE });
    });

    fixtures.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState as State;
            f.actions.forEach(a => {
                state = modalReducer(state, a);
            });
            expect(state).toEqual(f.result);
        });
    });
});
