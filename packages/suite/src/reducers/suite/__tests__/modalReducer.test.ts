import { type State, modalReducer } from '@suite/modal';

import { type Action } from 'src/types/suite';

import fixtures from '../__fixtures__/modalReducer';

describe('modalReducer', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState as State;
            f.actions.forEach(a => {
                state = modalReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});
