import protocolReducer, { State } from '../protocolReducer';
import fixtures from '../__fixtures__/protocolReducer';

import type { Action } from 'src/types/suite';

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
