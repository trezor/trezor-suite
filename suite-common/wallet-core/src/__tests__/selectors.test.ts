import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';

import { selectDiscoveryAccountsParam, selectShouldRediscover } from '../selectors';
import type { WalletCoreCompoundRootState } from '../selectors';
import { initialWalletSettingsState } from '../settings/walletSettingsReducer';

const DEVICE_STATIC_SESSION_ID = '1stTestnetAddress@device_id:0' as const;

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

const createState = ({
    accounts,
    enabledNetworks,
}: {
    accounts: ReturnType<typeof mockWalletAccount>[];
    enabledNetworks: NetworkSymbol[];
}) => {
    const selectedDevice = createDevice();

    return {
        device: {
            devices: [selectedDevice],
            selectedDevice,
            persistentDeviceData: [],
        },
        wallet: {
            accounts,
            discovery: {},
            settings: {
                ...initialWalletSettingsState,
                enabledNetworks,
            },
        },
    } satisfies WalletCoreCompoundRootState;
};

describe('wallet-core selectors', () => {
    describe(selectDiscoveryAccountsParam.name, () => {
        it.each(['tsep', 'thod'] as const)(
            'injects a normal discovery request for legacy-only %s wallets',
            symbol => {
                const state = createState({
                    accounts: [createEvmTestnetAccount(symbol, { accountType: 'legacy', empty: true })],
                    enabledNetworks: [symbol],
                });

                const [coin] = selectDiscoveryAccountsParam(state, DEVICE_STATIC_SESSION_ID, true);

                expect(coin).toMatchObject({
                    symbol,
                    identity: DEVICE_STATIC_SESSION_ID,
                    knownOnly: true,
                });
                expect(coin.known).toEqual(
                    expect.arrayContaining([
                        { type: 'legacy' },
                        { type: 'normal', skip: 0 },
                    ]),
                );
            },
        );

        it.each(['tsep', 'thod'] as const)(
            'does not inject an extra normal request for %s wallets that already have one',
            symbol => {
                const state = createState({
                    accounts: [
                        createEvmTestnetAccount(symbol, {
                            accountType: 'legacy',
                            empty: true,
                            path: "m/44'/1'/0'/0/0",
                        }),
                        createEvmTestnetAccount(symbol, {
                            accountType: 'normal',
                            empty: true,
                            descriptor: asAccountDescriptor(`${symbol}-normal-descriptor`),
                            path: "m/44'/60'/0'/0/0",
                        }),
                    ],
                    enabledNetworks: [symbol],
                });

                const [coin] = selectDiscoveryAccountsParam(state, DEVICE_STATIC_SESSION_ID, true);
                const normalRequests = coin.known?.filter(
                    (
                        known: { type: string; skip?: number },
                    ): known is { type: 'normal'; skip?: number } => known.type === 'normal',
                );

                expect(normalRequests).toEqual([{ type: 'normal' }]);
            },
        );

        it('keeps discovery params unchanged for unaffected networks', () => {
            const state = createState({
                accounts: [
                    mockWalletAccount({
                        symbol: 'eth',
                        deviceState: DEVICE_STATIC_SESSION_ID,
                        accountType: 'normal',
                        empty: true,
                        path: "m/44'/60'/0'/0/0",
                    }),
                ],
                enabledNetworks: ['eth'],
            });

            const [coin] = selectDiscoveryAccountsParam(state, DEVICE_STATIC_SESSION_ID, true);

            expect(coin).toEqual({
                symbol: 'eth',
                identity: DEVICE_STATIC_SESSION_ID,
                known: [{ type: 'normal' }],
                knownOnly: true,
            });
        });
    });

    describe(selectShouldRediscover.name, () => {
        it.each(['tsep', 'thod'] as const)(
            'returns true for legacy-only %s wallets even when they are empty',
            symbol => {
                const state = createState({
                    accounts: [createEvmTestnetAccount(symbol, { accountType: 'legacy', empty: true })],
                    enabledNetworks: [symbol],
                });

                expect(selectShouldRediscover(state, state.device.selectedDevice)).toBe(true);
            },
        );

        it.each(['tsep', 'thod'] as const)(
            'returns false for %s once a normal account exists and there are no other rediscovery triggers',
            symbol => {
                const state = createState({
                    accounts: [
                        createEvmTestnetAccount(symbol, {
                            accountType: 'legacy',
                            empty: true,
                            path: "m/44'/1'/0'/0/0",
                        }),
                        createEvmTestnetAccount(symbol, {
                            accountType: 'normal',
                            empty: true,
                            descriptor: asAccountDescriptor(`${symbol}-normal-descriptor`),
                            path: "m/44'/60'/0'/0/0",
                        }),
                    ],
                    enabledNetworks: [symbol],
                });

                expect(selectShouldRediscover(state, state.device.selectedDevice)).toBe(false);
            },
        );
    });
});
