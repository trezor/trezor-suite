import { combineReducers } from '@reduxjs/toolkit';

import { prepareDeviceReducer } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    initPreloadedState,
} from '@suite-common/test-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import TrezorConnect, { UI_REQUEST } from '@trezor/connect';

import { prepareAccountsReducer } from '../../accounts/accountsReducer';
import { prepareDiscoveryReducer } from '../discoveryReducer';
import { runAdditionalDiscoveryThunk } from '../discoveryThunks';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../../settings/walletSettingsReducer';

const accountsReducer = prepareAccountsReducer(extraDependenciesCommonMock);
const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
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

const DEVICE_STATIC_SESSION_ID = '1stTestnetAddress@device_id:0' as const;
type DiscoverAccountsParams = Parameters<typeof TrezorConnect.discoverAccounts>[0];

const createDevice = () =>
    mockSuiteDevice({
        path: 'device-path',
        state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
        connected: true,
        available: true,
        discovered: true,
        remember: true,
    });

const createEvmTestnetAccount = (
    symbol: Extract<NetworkSymbol, 'tsep' | 'thod'>,
    account: Partial<Parameters<typeof mockWalletAccount>[0]> = {},
) =>
    mockWalletAccount(
        {
            symbol,
            deviceState: DEVICE_STATIC_SESSION_ID,
            ...account,
        },
        networkSpecificDefaultEthereum,
    );

const initStore = ({
    symbol,
    accounts,
}: {
    symbol: Extract<NetworkSymbol, 'tsep' | 'thod'>;
    accounts: ReturnType<typeof mockWalletAccount>[];
}) => {
    const selectedDevice = createDevice();
    const preloadedState = initPreloadedState({
        rootReducer,
        partialState: {
            device: {
                devices: [selectedDevice],
                selectedDevice,
                persistentDeviceData: [],
            },
            wallet: {
                accounts,
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks: [symbol],
                },
            },
        },
    });

    return configureMockStore({ reducer: rootReducer, preloadedState });
};

describe(runAdditionalDiscoveryThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('creates a missing normal tsep account through discovery progress', async () => {
        let progressHandler: ((event: any) => void) | undefined;
        const store = initStore({
            symbol: 'tsep',
            accounts: [
                createEvmTestnetAccount('tsep', {
                    accountType: 'legacy',
                    empty: true,
                    descriptor: asAccountDescriptor('tsep-legacy-account'),
                    path: "m/44'/1'/0'/0/0",
                }),
            ],
        });

        jest.spyOn(TrezorConnect, 'getDeviceState').mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: DEVICE_STATIC_SESSION_ID } },
        } as any);
        jest.spyOn(TrezorConnect, 'on').mockImplementation((event: string, callback: any) => {
            if (event === UI_REQUEST.BUNDLE_PROGRESS) {
                progressHandler = callback;
            }
        });
        jest.spyOn(TrezorConnect, 'off').mockImplementation(() => {
            progressHandler = undefined;
        });
        jest.spyOn(TrezorConnect, 'discoverAccounts').mockImplementation(
            async (params: DiscoverAccountsParams) => {
                expect(params.coins).toEqual([
                    expect.objectContaining({
                        symbol: 'tsep',
                        identity: DEVICE_STATIC_SESSION_ID,
                        knownOnly: true,
                        known: expect.arrayContaining([
                            { type: 'legacy' },
                            { type: 'normal', skip: 0 },
                        ]),
                    }),
                ]);

                progressHandler?.({
                    total: 1,
                    progress: 1,
                    response: {
                        failed: false,
                        symbol: 'tsep',
                        type: 'normal',
                        index: 0,
                        path: "m/44'/60'/0'/0/0",
                        descriptor: '0xnewTsepAccount',
                        balance: '1',
                        availableBalance: '1',
                        empty: false,
                        history: {
                            total: 0,
                            unconfirmed: 0,
                            transactions: [],
                        },
                        misc: { nonce: '0' },
                    },
                });

                return {
                    success: true,
                    payload: {
                        empty: 0,
                        nonempty: 1,
                        failed: 0,
                    },
                } as any;
            },
        );

        await store.dispatch(runAdditionalDiscoveryThunk(DEVICE_STATIC_SESSION_ID));

        const tsepAccounts = store
            .getState()
            .wallet.accounts.filter(
                (account: ReturnType<typeof mockWalletAccount>) => account.symbol === 'tsep',
            );
        const tsepNormalAccounts = tsepAccounts.filter(
            (account: ReturnType<typeof mockWalletAccount>) => account.accountType === 'normal',
        );

        expect(tsepAccounts).toHaveLength(2);
        expect(tsepNormalAccounts).toHaveLength(1);
        expect(tsepNormalAccounts[0]).toMatchObject({
            path: "m/44'/60'/0'/0/0",
            empty: false,
            index: 0,
            accountType: 'normal',
        });
    });

    it('does not inject a missing-normal request or duplicate a normal tsep account that already exists', async () => {
        const store = initStore({
            symbol: 'tsep',
            accounts: [
                createEvmTestnetAccount('tsep', {
                    accountType: 'legacy',
                    empty: true,
                    descriptor: asAccountDescriptor('tsep-legacy-account'),
                    path: "m/44'/1'/0'/0/0",
                }),
                createEvmTestnetAccount('tsep', {
                    accountType: 'normal',
                    empty: true,
                    descriptor: asAccountDescriptor('tsep-normal-account'),
                    path: "m/44'/60'/0'/0/0",
                }),
            ],
        });

        jest.spyOn(TrezorConnect, 'getDeviceState').mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: DEVICE_STATIC_SESSION_ID } },
        } as any);
        jest.spyOn(TrezorConnect, 'on').mockImplementation((_event: string, _callback: any) => {});
        jest.spyOn(TrezorConnect, 'off').mockImplementation(() => {});
        jest.spyOn(TrezorConnect, 'discoverAccounts').mockImplementation(
            async (params: DiscoverAccountsParams) => {
                expect(params.coins).toEqual([
                    expect.objectContaining({
                        symbol: 'tsep',
                        identity: DEVICE_STATIC_SESSION_ID,
                        knownOnly: true,
                        known: [{ type: 'legacy' }, { type: 'normal' }],
                    }),
                ]);

                return {
                    success: true,
                    payload: {
                        empty: 0,
                        nonempty: 0,
                        failed: 0,
                    },
                } as any;
            },
        );

        await store.dispatch(runAdditionalDiscoveryThunk(DEVICE_STATIC_SESSION_ID));

        const tsepNormalAccounts = store
            .getState()
            .wallet.accounts.filter(
                (account: ReturnType<typeof mockWalletAccount>) =>
                    account.symbol === 'tsep' && account.accountType === 'normal',
            );

        expect(tsepNormalAccounts).toHaveLength(1);
        expect(tsepNormalAccounts[0]).toMatchObject({
            descriptor: asAccountDescriptor('tsep-normal-account'),
            path: "m/44'/60'/0'/0/0",
        });
    });
});
