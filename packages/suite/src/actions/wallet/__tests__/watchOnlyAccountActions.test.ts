import { combineReducers } from '@reduxjs/toolkit';

import { WATCH_ONLY_DEVICE_ID, deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    wireEnabledNetworksMock,
} from '@suite-common/test-utils';
import {
    prepareAccountsReducer,
    prepareWalletSettingsReducer,
    selectAllAccountsToList,
} from '@suite-common/wallet-core';
import TrezorConnect, { type AccountInfo } from '@trezor/connect';

import {
    type WatchOnlyAccountImportInstruction,
    getWatchOnlyAccountImportInstructions,
    storeWatchOnlyAccountImportInstruction,
} from 'src/utils/wallet/watchOnlyAccountStorage';

import {
    WATCH_ONLY_DEVICE_STATE,
    importWatchOnlyAccountThunk,
    removeWatchOnlyAccountThunk,
    restoreWatchOnlyAccountsThunk,
} from '../watchOnlyAccountActions';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        getAccountInfo: jest.fn(),
    },
}));

const EVM_ADDRESS = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';
const BTC_ADDRESS = '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo';

const accountInfo: AccountInfo = {
    descriptor: EVM_ADDRESS,
    balance: '1',
    availableBalance: '1',
    empty: false,
    history: {
        total: 0,
        unconfirmed: 0,
        transactions: [],
    },
    tokens: [],
};

const rootReducer = combineReducers({
    device: prepareDeviceReducer(extraDependenciesCommonMock),
    wallet: combineReducers({
        accounts: prepareAccountsReducer(extraDependenciesCommonMock),
        settings: prepareWalletSettingsReducer(extraDependenciesCommonMock),
    }),
});

const createStore = () => configureMockStore({ reducer: rootReducer });
type TestStore = ReturnType<typeof createStore>;

const importAccount = (
    store: TestStore,
    overrides: Partial<WatchOnlyAccountImportInstruction> = {},
) =>
    store.dispatch(
        importWatchOnlyAccountThunk({
            descriptor: EVM_ADDRESS,
            symbol: 'eth',
            ...overrides,
        }),
    );

const getAccountInfoMock = TrezorConnect.getAccountInfo as jest.Mock;

describe(importWatchOnlyAccountThunk.name, () => {
    let enabledNetworksMock: ReturnType<typeof wireEnabledNetworksMock>;

    beforeEach(() => {
        window.sessionStorage.clear();
        getAccountInfoMock.mockReset();
        getAccountInfoMock.mockResolvedValue({
            success: true,
            payload: accountInfo,
        });
        enabledNetworksMock = wireEnabledNetworksMock();
    });

    it('imports, restores and removes a session-only account', async () => {
        const store = createStore();

        await importAccount(store, {
            accountLabel: 'QA whale',
            descriptor: `  ${EVM_ADDRESS}  `,
        });

        expect(enabledNetworksMock.updateConnectSettings.mock.invocationCallOrder[0]!).toBeLessThan(
            getAccountInfoMock.mock.invocationCallOrder[0]!,
        );
        expect(store.getState().wallet.settings.enabledNetworks).toEqual(['eth']);
        expect(store.getState().device.devices).toContainEqual(
            expect.objectContaining({
                id: WATCH_ONLY_DEVICE_ID,
                state: {
                    staticSessionId: WATCH_ONLY_DEVICE_STATE,
                },
                remember: false,
            }),
        );
        const restoredStore = createStore();
        await restoredStore.dispatch(restoreWatchOnlyAccountsThunk());
        expect(restoredStore.getState().device.selectedDevice?.id).toBe(WATCH_ONLY_DEVICE_ID);
        expect(selectAllAccountsToList(restoredStore.getState())).toEqual([
            expect.objectContaining({
                accountType: 'imported',
                descriptor: EVM_ADDRESS,
                imported: true,
                isWatchOnly: true,
                symbol: 'eth',
                accountLabel: 'QA whale',
            }),
        ]);

        const account = restoredStore.getState().wallet.accounts.at(0);
        expect(account).toBeDefined();
        if (!account) {
            return;
        }

        await restoredStore.dispatch(removeWatchOnlyAccountThunk({ account }));
        expect(restoredStore.getState().wallet.accounts).toEqual([]);
        expect(restoredStore.getState().device.devices).not.toContainEqual(
            expect.objectContaining({ id: WATCH_ONLY_DEVICE_ID }),
        );
        expect(getWatchOnlyAccountImportInstructions()).toEqual([]);
    });

    it('rejects non-address-based networks before account discovery', async () => {
        const store = createStore();

        const result = await importAccount(store, {
            descriptor: BTC_ADDRESS,
            symbol: 'btc',
        });

        expect(importWatchOnlyAccountThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBe('Only address-based networks support watch-only accounts.');
        expect(getAccountInfoMock).not.toHaveBeenCalled();
    });

    it('keeps a selected physical device while restoring accounts', async () => {
        storeWatchOnlyAccountImportInstruction({
            descriptor: EVM_ADDRESS,
            symbol: 'eth',
        });
        const store = createStore();
        const selectedDevice = mockSuiteDevice({ id: 'physical-device' });
        store.dispatch(deviceActions.selectDevice(selectedDevice));

        await store.dispatch(restoreWatchOnlyAccountsThunk());

        expect(store.getState().device.selectedDevice?.id).toBe(selectedDevice.id);
    });
});
