import type { Action } from 'src/types/suite';

import fixtures from '../__fixtures__/protocolReducer';
import protocolReducer, { State } from '../protocolReducer';

describe('Protocol reducer', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState as State;
            f.actions.forEach(a => {
                state = protocolReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});
