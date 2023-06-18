import { coinjoinReducer, CoinjoinState } from '../coinjoinReducer';
import fixtures from '../__fixtures__/coinjoinReducer';

import type { Action } from 'src/types/suite';

describe('Coinjoin reducer', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            let state = f.initialState as unknown as CoinjoinState;
            f.actions.forEach(a => {
                state = coinjoinReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});
