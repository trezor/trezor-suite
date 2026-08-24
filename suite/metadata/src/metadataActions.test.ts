import fs from 'fs';
import path from 'path';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { initialWalletSettingsState, prepareAccountsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';
import TrezorConnect from '@trezor/connect';
import { asWalletDescriptor } from '@trezor/device-utils';

import * as fixtures from './__fixtures__/metadataActions';
import * as metadataActions from './metadataActions';
import * as metadataLabelingActions from './metadataLabelingActions';
import * as metadataProviderActions from './metadataProviderThunks';
import { type SuiteRootStateSliceForMetadata, metadataReducer } from './metadataReducer';
import * as metadataThunks from './metadataThunks';
import { DropboxProvider } from './providers/DropboxProvider';

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});
const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});
const extra: metadataLabelingActions.InitMetadataDeps = {
    services: { analytics: mockDesktopAnalytics() },
};

jest.spyOn(TrezorConnect, 'cipherKeyValue').mockImplementation(() =>
    Promise.resolve({
        success: true,
        payload: {
            value: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
        } as any, // typings expect bundle response
    }),
);

// use real package
jest.unmock('dropbox');
// use fetch mock (used in Dropbox constructor, requesting to https://api.dropboxapi.com/)
jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve<any>({}));

/**
 * Hack: DropboxProvider calls `window.fetch....`
 */
const globalContext = globalThis as typeof globalThis & { window?: typeof globalThis };
if (!globalContext.window) {
    globalContext.window = globalThis as any;
}

type MetadataState = ReturnType<typeof metadataReducer>;
interface InitialState {
    metadata?: MetadataState;
    device: any;
    accounts: any[];
    suite: Partial<SuiteRootStateSliceForMetadata>;
    suiteSettings?: {
        debug?: {
            oauthServerEnvironment?: string;
        };
    };
}

const getInitialState = (state?: InitialState) => {
    const metadata = state ? state.metadata : undefined;
    const suite = state ? state.suite : {};
    const suiteSettings = state?.suiteSettings ?? {};

    const device = state
        ? state.device
        : {
              state: { staticSessionId: '1stTestnetAddress@device_id:0' },
              connected: true,
              metadata: { status: 'disabled' },
          };
    const accounts = state ? state.accounts || [] : [];
    const debug = suiteSettings.debug ?? {};
    const initAction: any = { type: '@storage/load', payload: { metadata } };

    return {
        metadata: metadataReducer(metadata, initAction),
        device: {
            devices: device ? [device] : [],
            selectedDevice: device,
            persistentDeviceData: [],
            isConnectionModalOpen: false,
        },
        suite: {
            ...suite,
        },
        suiteSettings: {
            ...suiteSettings,
            debug, // debug settings are needed for OAuth API
        },
        wallet: {
            accounts,
            selectedAccount: {
                account: accounts[0],
            },
            settings: initialWalletSettingsState,
        },
        router: {
            app: 'fo',
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const initStore = (state: State) => {
    const store = createTestStore<typeof extra, State, any>({
        extra,
        reducer: (s = state, action: any): State => {
            // the reducer may also receive the empty PreloadedState ({}), fall back to the initial state
            const current = { ...state, ...s };

            return { ...current, metadata: metadataReducer(current.metadata, action) };
        },
        preloadedState: state,
        serializableCheck: {
            ignoredActions: ['@modal/open-user-context'],
        },
    });
    store.subscribe(async () => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];
        if (!action) return;

        // hack: to prevent dependency
        if (action.type === '@modal/open-user-context') {
            // automatically resolve modal decision
            switch (action.payload.type) {
                case 'metadata-provider':
                    await store.dispatch(
                        metadataProviderActions.connectProvider({ type: 'dropbox' }),
                    );
                    action.payload.decision.resolve(true);
                    break;
                default:
                    action.payload.decision.resolve(true);
            }
        }

        const { metadata, device, wallet } = store.getState();
        store.getState().metadata = metadataReducer(metadata, action);
        store.getState().wallet.accounts = accountsReducer(wallet.accounts, action);
        store.getState().device = deviceReducer(device, action) as any;
    });

    return store;
};

describe('Metadata Actions', () => {
    beforeAll(() => {
        jest.mock('./providers/DropboxProvider');
        DropboxProvider.prototype.connect = () =>
            Promise.resolve({ success: true, payload: undefined });
        DropboxProvider.prototype.getProviderDetails = () =>
            Promise.resolve({
                success: true,
                payload: {
                    type: 'dropbox',
                    isCloud: true,
                    tokens: {
                        refreshToken: 'token',
                    },
                    user: 'power-user',
                    clientId: 'meow',
                },
            });

        // eslint-disable-next-line require-await
        DropboxProvider.prototype.getFileContent = async (filename: string) => {
            if (filename === '828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85') {
                const file = fs.readFileSync(
                    path.resolve(
                        __dirname,
                        './__fixtures__/828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85.mtdt',
                    ),
                );

                return { success: true, payload: file };
            }

            return { success: true, payload: undefined };
        };
        DropboxProvider.prototype.getFilesList = () =>
            Promise.resolve({ success: true, payload: [] });
        DropboxProvider.prototype.setFileContent = () =>
            Promise.resolve({
                success: true,
                payload: undefined,
            });
    });

    fixtures.setDeviceMetadataKey.forEach(f => {
        it(`setDeviceMetadataKey - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataLabelingActions.setDeviceMetadataKey(...f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.setAccountMetadataKey.forEach(f => {
        it(`setAccountMetadataKey - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            const account = await store.dispatch(
                metadataLabelingActions.setAccountMetadataKey(...f.params),
            );
            expect(account).toMatchObject(f.result);
        });
    });

    fixtures.addDeviceMetadata.forEach(f => {
        it(`addDeviceMetadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataLabelingActions.addDeviceMetadata(...f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });

    fixtures.addAccountMetadata.forEach(f => {
        it(`addAccountMetadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataLabelingActions.addAccountMetadata(...f.params));

            const result = store.getActions();
            if (!f.result) {
                expect(result.length).toEqual(0);
            } else {
                expect(result).toEqual(f.result);
            }
        });
    });

    fixtures.connectProvider.forEach(f => {
        it(`connectProvider - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataProviderActions.connectProvider(...f.params));

            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toEqual(f.result);
            }
        });
    });

    fixtures.addMetadata.forEach(f => {
        it(`add metadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));

            await store.dispatch(metadataLabelingActions.addMetadata(...f.params));

            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toEqual(expect.arrayContaining(f.result));
            }
        });
    });

    fixtures.enableMetadata.forEach(f => {
        it(`enableMetadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataActions.enableMetadata());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.disableMetadata.forEach(f => {
        it(`disableMetadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataThunks.disableMetadata());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.init.forEach(f => {
        it(`initMetadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataLabelingActions.init(...f.params));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(f.result);
            }
        });
    });

    fixtures.disposeMetadata.forEach(f => {
        it(`disposeMetadata - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataThunks.disposeMetadata(...f.params));
            if (f.result) {
                expect(store.getState()).toMatchObject(f.result);
            }
        });
    });

    fixtures.disposeMetadataKeys.forEach(f => {
        it(`disposeMetadataKeys - ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState));
            await store.dispatch(metadataThunks.disposeMetadataKeys(...f.params));
            if (f.result) {
                expect(store.getState()).toMatchObject(f.result);
            }
        });
    });

    it('marks wallet as migrated after legacy labeling migration succeeds', () => {
        const walletDescriptor = asWalletDescriptor('wallet-descriptor');
        const store = initStore(getInitialState());

        store.dispatch(metadataActions.setLegacyLabelsMigrationForWallet(walletDescriptor));

        expect(store.getState().metadata.hasLegacyLabelsMigrated).toEqual({
            [walletDescriptor]: true,
        });
    });

    it('removes wallet migration flag after wallet is forgotten', () => {
        const forgottenWalletDescriptor = asWalletDescriptor('1stTestnetAddress');
        const otherWalletDescriptor = asWalletDescriptor('other-wallet');
        const store = initStore(getInitialState());

        store.dispatch(
            metadataActions.setLegacyLabelsMigrationForWallet(forgottenWalletDescriptor),
        );
        store.dispatch(metadataActions.setLegacyLabelsMigrationForWallet(otherWalletDescriptor));
        store.dispatch(
            deviceActions.forgetDevice({ device: store.getState().device.selectedDevice }),
        );

        expect(store.getState().metadata.hasLegacyLabelsMigrated).toEqual({
            [otherWalletDescriptor]: true,
        });
    });
});
