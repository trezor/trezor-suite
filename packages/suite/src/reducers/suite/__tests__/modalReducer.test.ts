import modalReducer, { State } from '../modalReducer';
import { Action } from '@suite-types';
import fixtures from './fixtures/modalReducer';

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
