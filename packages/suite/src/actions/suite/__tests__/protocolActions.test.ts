import { testMocks } from '@suite-common/test-utils';

import { configureStore } from 'src/support/tests/configureStore';
import protocolReducer, { State as ProtocolState } from 'src/reducers/suite/protocolReducer';
import { PROTOCOL_SCHEME } from 'src/constants/suite/protocol';

import * as protocolActions from '../protocolActions';
import * as protocolConstants from '../constants/protocolConstants';

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

export const getInitialState = (state?: ProtocolState) => ({
    protocol: {
        ...protocolReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
    device: {
        device: undefined,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

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
    it('gives a command to fill a send form with address and amount', async () => {
        const store = initStore(
            getInitialState({
                sendForm: {
                    scheme: PROTOCOL_SCHEME.BITCOIN,
                    address: '12345abcde',
                    amount: 1.02,
                    shouldFill: false,
                },
            }),
        );

        await store.dispatch(protocolActions.fillSendForm(true));
        await store.dispatch(protocolActions.fillSendForm(false));

        expect(store.getActions().length).toBe(2);
        expect(store.getActions()[0].type).toBe(protocolConstants.FILL_SEND_FORM);
        expect(store.getActions()[0].payload).toBe(true);
        expect(store.getActions()[1].type).toBe(protocolConstants.FILL_SEND_FORM);
        expect(store.getActions()[1].payload).toBe(false);
    });

    it('gives a command to fill a send form with address', async () => {
        const store = initStore(
            getInitialState({
                sendForm: {
                    scheme: PROTOCOL_SCHEME.BITCOIN,
                    address: '12345abcde',
                    amount: undefined,
                    shouldFill: false,
                },
            }),
        );

        await store.dispatch(protocolActions.fillSendForm(true));
        await store.dispatch(protocolActions.fillSendForm(false));

        expect(store.getActions().length).toBe(2);
        expect(store.getActions()[0].type).toBe(protocolConstants.FILL_SEND_FORM);
        expect(store.getActions()[0].payload).toBe(true);
        expect(store.getActions()[1].type).toBe(protocolConstants.FILL_SEND_FORM);
        expect(store.getActions()[1].payload).toBe(false);
    });

    it('saves address and amount from Bitcoin URI protocol', async () => {
        const store = initStore(getInitialState());

        await store.dispatch(
            protocolActions.handleProtocolRequest('bitcoin:12345abcde?amount=1.02'),
        );

        expect(store.getActions().length).toBe(2);
        expect(store.getActions()[0].type).toBe(protocolConstants.SAVE_COIN_PROTOCOL);
        expect(store.getActions()[0].payload.scheme).toBe(PROTOCOL_SCHEME.BITCOIN);
        expect(store.getActions()[0].payload.address).toBe('12345abcde');
        expect(store.getActions()[0].payload.amount).toBe(1.02);
    });

    it('saves address from Bitcoin URI protocol', async () => {
        const store = initStore(getInitialState());

        await store.dispatch(protocolActions.handleProtocolRequest('bitcoin:12345abcde'));

        expect(store.getActions().length).toBe(2);
        expect(store.getActions()[0].type).toBe(protocolConstants.SAVE_COIN_PROTOCOL);
        expect(store.getActions()[0].payload.scheme).toBe(PROTOCOL_SCHEME.BITCOIN);
        expect(store.getActions()[0].payload.address).toBe('12345abcde');
        expect(store.getActions()[0].payload.amount).toBe(undefined);
    });

    it('resets protocol state', async () => {
        const store = initStore(getInitialState());

        await store.dispatch(protocolActions.resetProtocol());

        expect(store.getActions().length).toBe(1);
        expect(store.getActions()[0].type).toBe(protocolConstants.RESET);
    });
});
