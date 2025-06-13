import type { Action } from 'src/types/suite';

import fixtures from '../__fixtures__/protocolReducer';
import protocolReducer, { ProtocolState } from '../protocolReducer';

describe('Protocol reducer', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            let state: ProtocolState = f.initialState as ProtocolState;
            f.actions.forEach(a => {
                state = protocolReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});
