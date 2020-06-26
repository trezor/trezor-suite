/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import metadataReducer from '@suite-reducers/metadataReducer';
import { STORAGE, MODAL } from '../constants';
import * as metadataActions from '../metadataActions';
import * as fixtures from '../__fixtures__/metadataActions';

jest.mock('trezor-connect', () => {
    let fixture: any;
    return {
        __esModule: true, // this property makes it work
        default: {
            cipherKeyValue: () =>
                fixture || {
                    success: true,
                    payload: {
                        value: 'CKValue',
                    },
                },
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {},
        BLOCKCHAIN: {},
    };
});

// @ts-ignore declare fetch (used in Dropbox constructor)
global.fetch = () => {};

jest.mock('dropbox', () => {
    class Dropbox {
        filesUpload() {
            return true;
        }
    }
    return {
        __esModule: true, // this property makes it work
        Dropbox,
    };
});

type MetadataState = ReturnType<typeof metadataReducer>;
interface InitialState {
    metadata?: MetadataState;
    device: any;
    accounts: any[];
}

export const getInitialState = (state?: InitialState) => {
    const metadata = state ? state.metadata : undefined;
    const device = state
        ? state.device
        : { state: 'device-state', metadata: { status: 'disabled' } };
    const accounts = state ? state.accounts || [] : [];
    const initAction: any = { type: STORAGE.LOADED, payload: { metadata } };
    return {
        metadata: metadataReducer(metadata, initAction),
        devices: [device], // device is needed for notification/event
        suite: {
            device, // device is needed for notification/event
        },
        wallet: {
            accounts,
            selectedAccount: {
                account: accounts[0],
            },
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];

        if (action.type === MODAL.OPEN_USER_CONTEXT) {
            // automatically resolve modal decision
            action.payload.decision.resolve(true);
        }
        const { metadata } = store.getState();
        store.getState().metadata = metadataReducer(metadata, action);
    });
    return store;
};

describe('Metadata Actions', () => {
    fixtures.getDeviceMetadataKey.forEach(f => {
        it(`getDeviceMetadataKey: ${f.description}`, async () => {
            // set fixtures in trezor-connect
            require('trezor-connect').setTestFixtures(f.connect);
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataActions.getDeviceMetadataKey());

            // store.subscribe(() => {
            //     const actions = store.getActions();
            //     const a = actions[actions.length - 1];

            //     if (a.type === MODAL.OPEN_USER_CONTEXT) {
            //         // catch bundle update called from 'start()' and stop discovery before TrezorConnect response
            //         a.payload.decision.resolve(true);
            //     }
            // });

            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action).toMatchObject(f.result);
            }
        });
    });

    fixtures.setAccountMetadataKey.forEach(f => {
        it(`setAccountMetadataKey: ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore Account is not complete
            const account = await store.dispatch(metadataActions.setAccountMetadataKey(f.account));
            expect(account).toMatchObject(f.result);
        });
    });

    fixtures.addDeviceMetadata.forEach(f => {
        it(`addDeviceMetadata: ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            await store.dispatch(metadataActions.addDeviceMetadata(f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });

    fixtures.addAccountMetadata.forEach(f => {
        it(`addAccountMetadata: ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            await store.dispatch(metadataActions.addAccountMetadata(f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });

    fixtures.fetchMetadata.forEach(f => {
        it(`fetchMetadata: ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            await store.dispatch(metadataActions.fetchMetadata('A'));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });
});
