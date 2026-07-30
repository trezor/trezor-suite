import { NETWORK_TO_PROTOCOLS } from '@suite-common/suite-constants';
import { configureMockStore } from '@suite-common/test-utils';

import protocolReducer, { type ProtocolState } from 'src/reducers/suite/protocolReducer';

import * as protocolConstants from './constants/protocolConstants';
import * as protocolActions from './protocolActions';

const getInitialState = (state?: ProtocolState) => ({
    protocol: {
        ...protocolReducer(undefined, { type: 'foo' } as any),
        ...state,
    },
    device: {
        device: undefined,
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = (preloadedState: State) =>
    configureMockStore({
        reducer: (state = preloadedState, action) => ({
            ...state,
            protocol: protocolReducer(state.protocol, action),
        }),
        preloadedState,
    });

describe('Protocol actions', () => {
    it('gives a command to fill a send form with address and amount', async () => {
        const store = mockStore(
            getInitialState({
                sendForm: {
                    scheme: NETWORK_TO_PROTOCOLS.btc[0],
                    address: '12345abcde',
                    amount: '1.02',
                    shouldFill: false,
                },
            }),
        );

        await store.dispatch(protocolActions.fillSendForm(true));
        await store.dispatch(protocolActions.fillSendForm(false));

        const actions = store.getActions();
        expect(actions).toHaveLength(2);

        const [fillSendFormAction, clearFillSendFormAction] = actions;
        expect(fillSendFormAction).toEqual({
            type: protocolConstants.FILL_SEND_FORM,
            payload: true,
        });
        expect(clearFillSendFormAction).toEqual({
            type: protocolConstants.FILL_SEND_FORM,
            payload: false,
        });
    });

    it('gives a command to fill a send form with address', async () => {
        const store = mockStore(
            getInitialState({
                sendForm: {
                    scheme: NETWORK_TO_PROTOCOLS.btc[0],
                    address: '12345abcde',
                    amount: undefined,
                    shouldFill: false,
                },
            }),
        );

        await store.dispatch(protocolActions.fillSendForm(true));
        await store.dispatch(protocolActions.fillSendForm(false));

        const actions = store.getActions();
        expect(actions).toHaveLength(2);

        const [fillSendFormAction, clearFillSendFormAction] = actions;
        expect(fillSendFormAction).toEqual({
            type: protocolConstants.FILL_SEND_FORM,
            payload: true,
        });
        expect(clearFillSendFormAction).toEqual({
            type: protocolConstants.FILL_SEND_FORM,
            payload: false,
        });
    });

    it('saves address and amount from Bitcoin URI protocol', async () => {
        const store = mockStore(getInitialState());

        await store.dispatch(
            protocolActions.handleProtocolRequest('bitcoin:12345abcde?amount=1.02'),
        );

        const actions = store.getActions();
        expect(actions).toHaveLength(2);

        const [saveCoinProtocolAction] = actions;
        expect(saveCoinProtocolAction).toMatchObject({
            type: protocolConstants.SAVE_COIN_PROTOCOL,
            payload: {
                scheme: NETWORK_TO_PROTOCOLS.btc[0],
                address: '12345abcde',
                amount: '1.02',
            },
        });
    });

    it('saves address from Bitcoin URI protocol', async () => {
        const store = mockStore(getInitialState());

        await store.dispatch(protocolActions.handleProtocolRequest('bitcoin:12345abcde'));

        const actions = store.getActions();
        expect(actions).toHaveLength(2);

        const [saveCoinProtocolAction] = actions;
        expect(saveCoinProtocolAction).toMatchObject({
            type: protocolConstants.SAVE_COIN_PROTOCOL,
            payload: {
                scheme: NETWORK_TO_PROTOCOLS.btc[0],
                address: '12345abcde',
                amount: undefined,
            },
        });
    });

    it('resets protocol state', async () => {
        const store = mockStore(getInitialState());

        await store.dispatch(protocolActions.resetProtocol());

        const actions = store.getActions();
        expect(actions).toHaveLength(1);

        const [resetProtocolAction] = actions;
        expect(resetProtocolAction).toEqual({
            type: protocolConstants.RESET,
        });
    });
});
