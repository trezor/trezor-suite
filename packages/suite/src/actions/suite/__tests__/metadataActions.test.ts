/* eslint-disable global-require */
import fs from 'fs';
import path from 'path';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import metadataReducer from '@suite-reducers/metadataReducer';
import suiteReducer, { SuiteState } from '@suite-reducers/suiteReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import { STORAGE, MODAL } from '../constants';
import * as metadataActions from '../metadataActions';
import * as fixtures from '../__fixtures__/metadataActions';
import DropboxProvider from '@suite/services/metadata/DropboxProvider';
import suiteMiddleware from '@suite-middlewares/suiteMiddleware';
import accountsReducer from '@wallet-reducers/accountsReducer';

jest.mock('trezor-connect', () => {
    let fixture: any;
    return {
        __esModule: true, // this property makes it work
        default: {
            cipherKeyValue: () =>
                fixture || {
                    success: true,
                    payload: {
                        value: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                    },
                },
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {},
        BLOCKCHAIN: {},
        TRANSPORT: {},
        UI: {},
    };
});

// @ts-ignore declare fetch (used in Dropbox constructor)
global.fetch = () => {};

jest.mock('dropbox', () => {
    class Dropbox {
        filesUpload() {
            return true;
        }
        getAuthenticationUrl() {
            return 'https://foo/bar';
        }
        setAccessToken() {}
        usersGetCurrentAccount() {
            return {
                // eslint-disable-next-line
                name: { given_name: 'haf' },
            };
        }
        getRefreshToken() {
            return 'token-haf-mnau';
        }
        getAccessToken() {
            return 'token-haf-mnau';
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
    suite: Partial<SuiteState>;
}

export const getInitialState = (state?: InitialState) => {
    const metadata = state ? state.metadata : undefined;
    const suite = state ? state.suite : {};

    const device = state
        ? state.device
        : { state: 'device-state', metadata: { status: 'disabled' } };
    const accounts = state ? state.accounts || [] : [];
    const initAction: any = { type: STORAGE.LOADED, payload: { metadata } };
    return {
        metadata: metadataReducer(metadata, initAction),
        devices: [device], // device is needed for notification/event
        suite: {
            ...suite,
            device, // device is needed for notification/event
        },
        wallet: {
            accounts,
            selectedAccount: {
                account: accounts[0],
            },
        },
        router: {
            app: 'fo',
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk, suiteMiddleware]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(async () => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];

        if (action.type === MODAL.OPEN_USER_CONTEXT) {
            // automatically resolve modal decision
            switch (action.payload.type) {
                case 'metadata-provider':
                    await store.dispatch(metadataActions.connectProvider('dropbox'));
                    action.payload.decision.resolve(true);
                    break;
                default:
                    action.payload.decision.resolve(true);
            }
        }
        const { metadata, suite, devices, wallet } = store.getState();
        store.getState().metadata = metadataReducer(metadata, action);
        // @ts-ignore
        store.getState().suite = suiteReducer(suite, action);
        store.getState().wallet.accounts = accountsReducer(wallet.accounts, action);
        store.getState().devices = deviceReducer(devices, action);
        // store.
    });
    return store;
};

describe('Metadata Actions', () => {
    fixtures.setDeviceMetadataKey.forEach(f => {
        it(`setDeviceMetadataKey - ${f.description}`, async () => {
            // set fixtures in trezor-connect
            require('trezor-connect').setTestFixtures(f.connect);
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataActions.setDeviceMetadataKey());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.setAccountMetadataKey.forEach(f => {
        it(`setAccountMetadataKey - ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore Account is not complete
            const account = await store.dispatch(metadataActions.setAccountMetadataKey(f.account));
            expect(account).toMatchObject(f.result);
        });
    });

    fixtures.addDeviceMetadata.forEach(f => {
        it(`addDeviceMetadata - ${f.description}`, async () => {
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
        it(`addAccountMetadata - ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            await store.dispatch(metadataActions.addAccountMetadata(f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });

    fixtures.connectProvider.forEach(f => {
        it(`connectProvider - ${f.description}`, async () => {
            jest.mock('@suite/services/metadata/DropboxProvider');
            DropboxProvider.prototype.connect = () => Promise.resolve(true);

            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            const result = await store.dispatch(metadataActions.connectProvider(f.params));

            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toEqual(f.result);
            }
        });
    });

    fixtures.addMetadata.forEach(f => {
        it(`add metadata - ${f.description}`, async () => {
            jest.mock('@suite/services/metadata/DropboxProvider');
            DropboxProvider.prototype.connect = () => Promise.resolve(true);
            DropboxProvider.prototype.getCredentials = () =>
                Promise.resolve({
                    success: true,
                    payload: {
                        type: 'dropbox',
                        token: 'token',
                        user: 'power-user',
                    },
                });
            DropboxProvider.prototype.getFileContent = async (filename: string) => {
                if (
                    filename === '828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85'
                ) {
                    const file = fs.readFileSync(
                        path.resolve(
                            __dirname,
                            '../../../utils/suite/__fixtures__/828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85.mtdt',
                        ),
                    );
                    return { success: true, payload: file };
                }
                return { success: true, payload: undefined };
            };
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));

            // @ts-ignore, params
            const result = await store.dispatch(metadataActions.addMetadata(f.params));

            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toEqual(expect.arrayContaining(f.result));
            }
        });
    });

    fixtures.enableMetadata.forEach(f => {
        it(`enableMetadata - ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            const result = await store.dispatch(metadataActions.enableMetadata());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.disableMetadata.forEach(f => {
        it(`disableMetadata - ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            const result = await store.dispatch(metadataActions.disableMetadata());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.initMetadata.forEach(f => {
        it(`initMetadata - ${f.description}`, async () => {
            // @ts-ignore
            const store = initStore(getInitialState(f.initialState));
            // @ts-ignore, params
            const result = await store.dispatch(metadataActions.init(f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });
});
