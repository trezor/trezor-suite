import type { Action } from 'src/types/suite';

import protocolReducer, { type ProtocolState } from './protocolReducer';
import fixtures from '../../../mocks/mockProtocolReducer';

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
