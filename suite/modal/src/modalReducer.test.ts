import fixtures from './__fixtures__/modalReducer';
import { type State, modalReducer } from './modalReducer';

describe('modalReducer', () => {
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
