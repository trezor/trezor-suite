import messageSystemReducer, { MessageSystemState } from '../messageSystemReducer';
import fixtures, { timestamp } from '../__fixtures__/messageSystemReducer';

import type { Action } from '@suite-types';

describe('Message system reducer', () => {
    fixtures.forEach(f => {
        beforeAll(() => {
            jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
        });

        it(f.description, () => {
            let state: MessageSystemState = f.initialState as MessageSystemState;
            f.actions.forEach(a => {
                state = messageSystemReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});
