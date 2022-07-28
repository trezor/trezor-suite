import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as coinjoinAccountActions from '../coinjoinAccountActions';
import * as fixtures from '../__fixtures__/coinjoinAccountActions';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('@trezor/connect').default;

export const getInitialState = () => ({
    suite: {
        locks: [],
        device: global.JestMocks.getSuiteDevice({ state: 'device-state', connected: true }),
    },
    modal: {},
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        store.getActions().push(action);
    });
    return store;
};

describe('coinjoinAccountActions', () => {
    fixtures.createCoinjoinAccount.forEach(f => {
        it(`createCoinjoinAccount: ${f.description}`, async () => {
            const initialState = getInitialState();
            const store = initStore(initialState);
            TrezorConnect.setTestFixtures(f.connect);

            await store.dispatch(coinjoinAccountActions.createCoinjoinAccount(f.params as any)); // params are incomplete
            expect(store.getActions().length).toBe(f.result.actions);
        });
    });
});
