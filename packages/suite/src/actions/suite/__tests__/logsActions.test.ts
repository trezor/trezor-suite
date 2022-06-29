import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as logsActions from '../logsActions';
import logsReducer, { State as LogsState } from '@suite-reducers/messageSystemReducer';
import { LOGS, SUITE } from '@suite-actions/constants';

export const getInitialState = (state?: LogsState) => ({
    logs: {
        ...logsReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { logs } = store.getState();
        store.getState().logs = logsReducer(logs, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Logs actions', () => {
    it('logs whitelisted online status action', async () => {
        jest.spyOn(Date.prototype, 'toUTCString').mockReturnValue('Fri, 01 Jul 2022 10:07:17 GMT');

        const store = initStore({
            logs: { ...getInitialState().logs },
        });

        expect(store.getActions().length).toBe(0);

        await store.dispatch(
            logsActions.addAction(
                {
                    type: SUITE.ONLINE_STATUS,
                    payload: true,
                },
                { status: true },
            ),
        );

        expect(store.getActions().length).toBe(1);
        expect(store.getActions()[0].type).toBe(LOGS.ADD);
        expect(store.getActions()[0].payload).toStrictEqual({
            datetime: 'Fri, 01 Jul 2022 10:07:17 GMT',
            type: SUITE.ONLINE_STATUS,
            payload: {
                status: true,
            },
        });
    });
});
