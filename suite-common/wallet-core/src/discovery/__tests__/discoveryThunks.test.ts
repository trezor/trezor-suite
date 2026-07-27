import { combineReducers } from '@reduxjs/toolkit';

import { WATCH_ONLY_DEVICE_ID, prepareDeviceReducer } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import TrezorConnect, { type DeviceUniquePath, type StaticSessionId } from '@trezor/connect';

import { prepareAccountsReducer } from '../../accounts/accountsReducer';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../../settings/walletSettingsReducer';
import { discoveryActions } from '../discoveryActions';
import { prepareDiscoveryReducer } from '../discoveryReducer';
import {
    runAdditionalDiscoveryThunk,
    runDiscoveryThunk,
    startDiscoveryThunk,
} from '../discoveryThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        getDeviceState: jest.fn(),
    },
}));

const WATCH_ONLY_DEVICE_STATE = `state@${WATCH_ONLY_DEVICE_ID}:1` as StaticSessionId;
const WATCH_ONLY_DEVICE_PATH = 'debug-watch-only-accounts' as DeviceUniquePath;
const watchOnlyDevice = mockSuiteDevice({
    id: WATCH_ONLY_DEVICE_ID,
    path: WATCH_ONLY_DEVICE_PATH,
    state: { staticSessionId: WATCH_ONLY_DEVICE_STATE },
});

const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
const accountsReducer = prepareAccountsReducer(extraDependenciesCommonMock);
const discoveryReducer = prepareDiscoveryReducer(extraDependenciesCommonMock);
const walletSettingsReducer = prepareWalletSettingsReducer(extraDependenciesCommonMock);
const rootReducer = combineReducers({
    device: deviceReducer,
    wallet: combineReducers({
        accounts: accountsReducer,
        discovery: discoveryReducer,
        settings: walletSettingsReducer,
    }),
});

const initStore = () => {
    const initialState = rootReducer(undefined, { type: 'test-init' });

    return configureMockStore({
        reducer: rootReducer,
        preloadedState: {
            ...initialState,
            device: {
                ...initialState.device,
                devices: [watchOnlyDevice],
                selectedDevice: watchOnlyDevice,
            },
            wallet: {
                ...initialState.wallet,
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks: ['btc'],
                },
            },
        },
    });
};
type TestStore = ReturnType<typeof initStore>;

describe('virtual device discovery', () => {
    const getDeviceStateMock = jest.mocked(TrezorConnect.getDeviceState);

    beforeEach(() => {
        getDeviceStateMock.mockRejectedValue(
            new Error('Virtual devices must not reach TrezorConnect.'),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        [
            'start',
            (store: TestStore) => store.dispatch(startDiscoveryThunk({ device: watchOnlyDevice })),
        ],
        [
            'direct',
            (store: TestStore) => store.dispatch(runDiscoveryThunk({ device: watchOnlyDevice })),
        ],
        [
            'additional',
            (store: TestStore) =>
                store.dispatch(runAdditionalDiscoveryThunk(WATCH_ONLY_DEVICE_STATE)),
        ],
    ])('skips %s discovery', async (_, runDiscovery) => {
        const store = initStore();
        store.dispatch(discoveryActions.startDiscovery(WATCH_ONLY_DEVICE_PATH));

        await runDiscovery(store);

        expect(store.getState().wallet.discovery).toEqual({});
        expect(getDeviceStateMock).not.toHaveBeenCalled();
    });
});
