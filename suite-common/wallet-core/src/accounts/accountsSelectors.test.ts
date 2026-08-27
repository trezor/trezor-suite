import type { DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol, networks } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { type AccountsRootState } from './accountsReducer';
import {
    selectAddressByNetworkAndPath,
    selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex,
    selectVisibleDeviceAccountsMap,
} from './accountsSelectors';

const BTC_DEVICE_SSID: `${string}@${string}:${number}` =
    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@AC94BB9C1B08FE73BE1E3322:0';
const BTC_DEVICE = mockSuiteDevice({ state: { staticSessionId: BTC_DEVICE_SSID } });

const ETH_DEVICE_SSID: `${string}@${string}:${number}` = '1stTestnetAddress@device_id:0';
const ETH_DEVICE = mockSuiteDevice({ state: { staticSessionId: ETH_DEVICE_SSID } });
const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');

const mockState: AccountsRootState & DeviceRootState = {
    wallet: {
        accounts: [
            {
                deviceState: BTC_DEVICE_SSID,
                index: 0,
                backendType: undefined,
                misc: undefined,
                marker: undefined,
                stellarCursor: undefined,
                key: mockAccountKey({
                    descriptor: '1BitcoinAddress',
                    symbol: btcSymbol,
                    deviceStaticSessionId: BTC_DEVICE_SSID,
                }),
                accountType: 'normal',
                empty: false,
                visible: true,
                balance: '0',
                availableBalance: '0',
                formattedBalance: '0',
                tokens: [],
                symbol: btcSymbol,
                path: "m/84'/0'/0'",
                descriptor: asAccountDescriptor('1BitcoinAddress'),
                addresses: {
                    unused: [
                        {
                            address: 'bc1unused',
                            path: "m/84'/0'/0'/0/0",
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                    used: [
                        {
                            address: 'bc1used',
                            path: "m/84'/0'/0'/0/1",
                            transfers: 2,
                            balance: '0',
                            sent: '1000000000',
                            received: '1000000000',
                        },
                    ],
                    change: [
                        {
                            address: 'bc1change',
                            path: "m/84'/0'/0'/1/0",
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                },
                utxo: [],
                history: { total: 3, unconfirmed: 0, addrTxCount: 5 },
                metadata: {
                    key: 'tpubDCZB6sR48s4T5Cr8qHUYSZEFCQMMHRg8AoVKVmvcAP5bRw7ArDKeoNwKAJujV3xCPkBvXH5ejSgbgyN6kREmF7sMd41NdbuHa8n1DZNxSMg',
                },
                networkType: 'bitcoin',
                page: { index: 1, size: 25, total: 1 },
            },
            {
                symbol: ethSymbol,
                networkType: 'ethereum',
                descriptor: asAccountDescriptor('0xEthereumAddress'),
                deviceState: ETH_DEVICE_SSID,
                key: mockAccountKey({
                    descriptor: '0xEthereumAddress',
                    symbol: ethSymbol,
                    deviceStaticSessionId: ETH_DEVICE_SSID,
                }),
                accountType: 'normal',
                index: 0,
                path: "m/44'/60'/0'/0",
                empty: true,
                visible: true,
                balance: '408873828678601000',
                availableBalance: '408873828678601000',
                formattedBalance: '0.408873828678601',
                tokens: [],
                utxo: [],
                history: {
                    total: 0,
                    unconfirmed: 0,
                },
                metadata: {
                    key: '1stTestnetAddress@device_id:0',
                    1: {
                        fileName: '',
                        aesKey: '',
                    },
                },
                page: undefined,
                misc: { nonce: '1' },
                marker: undefined,
                stellarCursor: undefined,
            },
        ],
    },
    device: {
        devices: [BTC_DEVICE, ETH_DEVICE],
        persistentDeviceData: [],
        buttonRequestsByPath: {},
    },
};

const getStateWithSelectedDevice = (
    state: AccountsRootState & DeviceRootState,
    selectedDevice: TrezorDevice,
): AccountsRootState & DeviceRootState => ({
    ...state,
    device: { ...state.device, selectedDevice },
});

describe('accountsSelectors', () => {
    describe(selectAddressByNetworkAndPath.name, () => {
        it('returns unused address for BTC', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
                networks['btc'],
                "m/84'/0'/0'/0/0",
            );
            expect(result).toBe('bc1unused');
        });

        it('returns used address for BTC', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
                networks['btc'],
                "m/84'/0'/0'/0/1",
            );
            expect(result).toBe('bc1used');
        });

        it('returns change address for BTC', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
                networks['btc'],
                "m/84'/0'/0'/1/0",
            );
            expect(result).toBe('bc1change');
        });

        it('does not return address from another device', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, ETH_DEVICE),
                networks['btc'],
                "m/84'/0'/0'/0/0",
            );
            expect(result).toBeUndefined();
        });

        it('returns descriptor for ETH', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, ETH_DEVICE),
                networks['eth'],
                "m/44'/60'/0'/0",
            );
            expect(result).toBe('0xEthereumAddress');
        });

        it('returns undefined for unknown path', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
                networks['btc'],
                "m/84'/0'/0'/9/9",
            );
            expect(result).toBeUndefined();
        });

        it('returns undefined if network is missing', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
                undefined,
                "m/84'/0'/0'/0/0",
            );
            expect(result).toBeUndefined();
        });

        it('returns undefined if path is missing', () => {
            const result = selectAddressByNetworkAndPath(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
                networks['btc'],
                undefined,
            );
            expect(result).toBeUndefined();
        });
    });

    describe('selectVisibleDeviceAccountsMap', () => {
        it('should return map of accounts for selected device only', () => {
            const btcAccount = mockState.wallet.accounts[0];

            if (!btcAccount) {
                throw new Error('Expected first BTC account in mockState.wallet.accounts');
            }

            const result = selectVisibleDeviceAccountsMap(
                getStateWithSelectedDevice(mockState, BTC_DEVICE),
            );

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(1);
            expect(result.get(btcAccount.key)).toEqual(
                expect.objectContaining({ key: btcAccount.key }),
            );
        });
    });

    describe('selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex', () => {
        const mockSolAccount = (override: Partial<Account>): Account =>
            ({
                symbol: solSymbol,
                accountType: 'normal',
                index: 0,
                deviceState: BTC_DEVICE_SSID,
                visible: true,
                key: mockAccountKey({
                    descriptor: `descriptor${override.index ?? 0}`,
                    symbol: solSymbol,
                    deviceStaticSessionId: BTC_DEVICE_SSID,
                }),
                ...override,
            }) as unknown as Account;

        const createState = (accounts: Account[]): AccountsRootState & DeviceRootState =>
            getStateWithSelectedDevice(
                {
                    wallet: { accounts },
                    device: {
                        devices: [BTC_DEVICE],
                        persistentDeviceData: [],
                        buttonRequestsByPath: {},
                    },
                },
                BTC_DEVICE,
            );

        it('matches by account index field even when indexes are not contiguous', () => {
            const account = mockSolAccount({ index: 2 });
            const state = createState([mockSolAccount({ index: 0 }), account]);

            expect(
                selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
                    state,
                    solSymbol,
                    'normal',
                    2,
                ),
            ).toBe(account.key);
        });

        it('resolves the replacement key after a failed account is replaced in place', () => {
            const failedAccount = mockSolAccount({
                key: mockAccountKey({
                    descriptor: 'failed:0:sol:normal',
                    symbol: solSymbol,
                    deviceStaticSessionId: BTC_DEVICE_SSID,
                }),
                failed: true,
            });
            const replacementAccount = mockSolAccount({ visible: false });

            expect(
                selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
                    createState([failedAccount]),
                    solSymbol,
                    'normal',
                    0,
                ),
            ).toBe(failedAccount.key);
            expect(
                selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
                    createState([replacementAccount]),
                    solSymbol,
                    'normal',
                    0,
                ),
            ).toBe(replacementAccount.key);
        });

        it('does not match an account of another device', () => {
            const otherDeviceAccount = mockSolAccount({
                deviceState: ETH_DEVICE_SSID,
                key: mockAccountKey({
                    descriptor: 'descriptor0',
                    symbol: solSymbol,
                    deviceStaticSessionId: ETH_DEVICE_SSID,
                }),
            });

            expect(
                selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
                    createState([otherDeviceAccount]),
                    solSymbol,
                    'normal',
                    0,
                ),
            ).toBeUndefined();
        });

        it('does not match an account of another account type with the same index', () => {
            const legacyAccount = mockSolAccount({ accountType: 'legacy' });

            expect(
                selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex(
                    createState([legacyAccount]),
                    solSymbol,
                    'normal',
                    0,
                ),
            ).toBeUndefined();
        });
    });
});
