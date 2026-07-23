import fs from 'fs';
import path from 'path';

import { prepareDeviceReducer } from '@suite-common/device';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState, prepareAccountsReducer } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import * as metadataProviderActions from '../metadataProviderThunks';
import { type SuiteRootStateSliceForMetadata, metadataReducer } from '../metadataReducer';
import { DropboxProvider } from '../providers/DropboxProvider';

const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
const accountsReducer = prepareAccountsReducer(extraDependenciesCommonMock);

jest.spyOn(TrezorConnect, 'cipherKeyValue').mockImplementation(() =>
    Promise.resolve({
        success: true,
        payload: {
            value: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
        } as any, // Typings expect bundle response.
    }),
);

// Use real package.
jest.unmock('dropbox');
// Use fetch mock (used in Dropbox constructor, requesting to https://api.dropboxapi.com/).
jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve<any>({}));

/**
 * Hack: DropboxProvider calls `window.fetch....`.
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

export const getInitialState = (state?: InitialState) => {
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
            debug, // Debug settings are needed for OAuth API.
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

export const initStore = (state: State) => {
    const store = configureMockStore<State, any>({
        reducer: (storedState = state, action: any): State => {
            // The reducer may also receive the empty PreloadedState ({}), fall back to initial state.
            const current = { ...state, ...storedState };

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

        // Prevent dependency by automatically resolving the modal decision.
        if (action.type === '@modal/open-user-context') {
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

export const setupDropboxProviderMock = () => {
    jest.mock('../providers/DropboxProvider');
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
                    '../__fixtures__/828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85.mtdt',
                ),
            );

            return { success: true, payload: file };
        }

        return { success: true, payload: undefined };
    };
    DropboxProvider.prototype.getFilesList = () => Promise.resolve({ success: true, payload: [] });
    DropboxProvider.prototype.setFileContent = () =>
        Promise.resolve({
            success: true,
            payload: undefined,
        });
};
