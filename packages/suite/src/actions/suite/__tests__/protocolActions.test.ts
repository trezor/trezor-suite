import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import protocolReducer, { State as ProtocolState } from '@suite-reducers/protocolReducer';
import * as protocolActions from '../protocolActions';
import * as protocolConstants from '../constants/protocolConstants';
import { PROTOCOL_SCHEME } from '@suite/support/suite/Protocol';

export const getInitialState = (state?: ProtocolState) => ({
    protocol: {
        ...protocolReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { protocol } = store.getState();
        store.getState().protocol = protocolReducer(protocol, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Protocol actions', () => {
    it('gives a command to fill a send form', async () => {
        const store = initStore({
            protocol: {
                ...getInitialState().protocol,
                sendForm: {
                    scheme: PROTOCOL_SCHEME.BITCOIN,
                    address: '12345abcde',
                    amount: 1.02,
                    shouldFillSendForm: false,
                },
            },
        });

        await store.dispatch(protocolActions.fillSendForm(true));
        await store.dispatch(protocolActions.fillSendForm(false));

        expect(store.getActions().length).toBe(2);
        expect(store.getActions()[0].type).toBe(protocolConstants.FILL_SEND_FORM);
        expect(store.getActions()[0].payload).toBe(true);
        expect(store.getActions()[1].type).toBe(protocolConstants.FILL_SEND_FORM);
        expect(store.getActions()[1].payload).toBe(false);
    });

    it('saves coin protocol', async () => {
        const store = initStore({
            protocol: {
                ...getInitialState().protocol,
            },
        });

        await store.dispatch(
            protocolActions.saveCoinProtocol(PROTOCOL_SCHEME.BITCOIN, '12345abcde', 1.02),
        );

        expect(store.getActions().length).toBe(1);
        expect(store.getActions()[0].type).toBe(protocolConstants.SAVE_COIN_PROTOCOL);
        expect(store.getActions()[0].payload.scheme).toBe(PROTOCOL_SCHEME.BITCOIN);
        expect(store.getActions()[0].payload.address).toBe('12345abcde');
        expect(store.getActions()[0].payload.amount).toBe(1.02);
    });

    it('resets protocol state', async () => {
        const store = initStore({
            protocol: {
                ...getInitialState().protocol,
                sendForm: {
                    scheme: PROTOCOL_SCHEME.BITCOIN,
                    address: '12345abcde',
                    amount: 1.02,
                    shouldFillSendForm: false,
                },
            },
        });

        await store.dispatch(protocolActions.resetProtocol());

        expect(store.getActions().length).toBe(1);
        expect(store.getActions()[0].type).toBe(protocolConstants.RESET);
    });
});
