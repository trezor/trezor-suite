/* eslint-disable global-require */

import { configureStore } from 'src/support/tests/configureStore';

import receiveReducer from 'src/reducers/wallet/receiveReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import modalReducer from 'src/reducers/suite/modalReducer';
import { connectInitThunk } from '@suite-common/connect-init';
import * as receiveActions from 'src/actions/wallet/receiveActions';
import fixtures from '../__fixtures__/receiveActions';

const { getSuiteDevice } = global.JestMocks;

jest.mock('@trezor/connect', () => {
    let fixture: any;
    let buttonRequest: ((e?: any) => any) | undefined;

    const getAddress = (_params: any) => {
        if (fixture && fixture.getAddress) {
            if (fixture.getAddress.success && buttonRequest) {
                buttonRequest({ code: 'ButtonRequest_Address' });
            }
            return fixture.getAddress;
        }
        // trigger multiple button requests
        if (buttonRequest) {
            buttonRequest({ code: 'ButtonRequest_Address' });
            buttonRequest({ code: 'some-other-code' });
            buttonRequest();
        }
        return {
            success: true,
            payload: {
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
        };
    };

    const { PROTO } = jest.requireActual('@trezor/connect');

    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            init: () => null,
            on: (event: string, cb: () => any) => {
                if (event === 'ui-button') buttonRequest = cb;
            },
            off: () => {
                buttonRequest = undefined;
            },
            getAddress,
            ethereumGetAddress: getAddress,
            rippleGetAddress: getAddress,
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE_EVENT: 'DEVICE_EVENT',
        UI_EVENT: 'UI_EVENT',
        TRANSPORT_EVENT: 'TRANSPORT_EVENT',
        BLOCKCHAIN_EVENT: 'BLOCKCHAIN_EVENT',
        DEVICE: {},
        TRANSPORT: {},
        BLOCKCHAIN: {},
        UI: {
            REQUEST_BUTTON: 'ui-button',
        },
        PROTO,
    };
});

type ReceiveState = ReturnType<typeof receiveReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;
type ModalState = ReturnType<typeof modalReducer>;

interface InitialState {
    suite: Partial<SuiteState>;
    wallet: {
        receive: ReceiveState;
        selectedAccount: {
            account?: {
                networkType: 'bitcoin' | 'ethereum' | 'ripple';
            };
        };
        settings: {
            enabledNetworks: string[];
        };
    };
    modal: ModalState;
}

export const getInitialState = (state: Partial<InitialState> | undefined) => ({
    devices: [],
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        device: getSuiteDevice({ available: true, connected: true }),
    },
    wallet: {
        receive: receiveReducer([], { type: 'foo' } as any),
        selectedAccount: {
            account: {
                networkType: 'bitcoin',
            },
        },
        settings: {
            enabledNetworks: ['btc'],
        },
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
    ...state,
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { receive } = store.getState().wallet;
        store.getState().wallet.receive = receiveReducer(receive, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('ReceiveActions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('@trezor/connect').setTestFixtures(f.mocks);
            const state = getInitialState(f.initialState as any);
            const store = initStore(state);
            await store.dispatch(connectInitThunk());
            await store.dispatch(f.action());

            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });

    it('show unverified address then verify', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@trezor/connect').setTestFixtures({});
        const state = getInitialState({
            wallet: {
                receive: receiveReducer([], { type: 'foo' } as any),
                selectedAccount: {
                    account: {
                        networkType: 'bitcoin',
                    },
                },
                settings: {
                    enabledNetworks: ['btc'],
                },
            },
        });
        const store = initStore(state);
        await store.dispatch(connectInitThunk());

        const VERIFIED = [{ path: 'a', address: 'b', isVerified: true }];
        const UNVERIFIED = [{ path: 'a', address: 'b', isVerified: false }];

        await store.dispatch(receiveActions.openAddressModal({ addressPath: 'a', value: 'b' }));
        expect(store.getState().wallet.receive).toEqual(UNVERIFIED);

        await store.dispatch(receiveActions.showAddress('a', 'b'));
        expect(store.getState().wallet.receive).toEqual(VERIFIED);

        await store.dispatch(receiveActions.openAddressModal({ addressPath: 'a', value: 'b' }));
        expect(store.getState().wallet.receive).toEqual(UNVERIFIED);

        // add second
        await store.dispatch(receiveActions.openAddressModal({ addressPath: 'c', value: 'd' }));
        expect(store.getState().wallet.receive.length).toEqual(2);

        // clear
        await store.dispatch(receiveActions.dispose());
        expect(store.getState().wallet.receive.length).toEqual(0);
    });
});
