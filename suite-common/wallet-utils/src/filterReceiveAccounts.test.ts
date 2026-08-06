import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { filterReceiveAccounts, isDebugOnlyAccountType } from './filterReceiveAccounts';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const polSymbol = asNetworkSymbol('pol');
const solSymbol = asNetworkSymbol('sol');
const tsepSymbol = asNetworkSymbol('tsep');

const accountsList: Account[] = [
    mockWalletAccount({ symbol: ethSymbol, accountType: 'legacy' }),
    mockWalletAccount({ symbol: ethSymbol, accountType: 'normal' }),
    mockWalletAccount({ symbol: ethSymbol, accountType: 'ledger' }),
    mockWalletAccount({ symbol: btcSymbol, accountType: 'coinjoin' }),
    mockWalletAccount({ symbol: btcSymbol, accountType: 'taproot' }),
    mockWalletAccount({ symbol: btcSymbol, accountType: 'legacy' }),
    mockWalletAccount({ symbol: btcSymbol, accountType: 'segwit' }),
    mockWalletAccount({ symbol: btcSymbol, accountType: 'ledger' }),
    mockWalletAccount({ symbol: polSymbol, accountType: 'legacy' }),
    mockWalletAccount({ symbol: polSymbol, accountType: 'normal' }),
    mockWalletAccount({ symbol: polSymbol, accountType: 'ledger' }),
    mockWalletAccount({
        symbol: solSymbol,
        accountType: 'normal',
        empty: true,
        visible: false,
    }),
    mockWalletAccount({ symbol: solSymbol, accountType: 'ledger' }),
    mockWalletAccount({
        symbol: solSymbol,
        accountType: 'ledger',
        empty: true,
        visible: false,
    }),
    mockWalletAccount({ symbol: tsepSymbol, accountType: 'normal' }),
    mockWalletAccount({ symbol: tsepSymbol, accountType: 'legacy' }),
];

type RunFilterReceiveAccountsTestParams = {
    isDebug?: boolean;
    symbol?: NetworkSymbol;
    deviceState?: `${string}@${string}:${number}`;
    accounts?: Account[];
};

const runFilterReceiveAccouns = ({
    isDebug = true,
    symbol = ethSymbol,
    deviceState = '1stTestnetAddress@device_id:0',
    accounts = accountsList,
}: RunFilterReceiveAccountsTestParams) => {
    const device = mockSuiteDevice({
        unavailableCapabilities: {
            dash: 'no-support',
        },
        state: { staticSessionId: deviceState },
    });

    return filterReceiveAccounts({
        accounts,
        deviceState: device.state?.staticSessionId,
        symbol,
        isDebug,
    });
};

describe('filter receive accounts', () => {
    it('checks if account is debug only type', () => {
        expect(isDebugOnlyAccountType('legacy', btcSymbol)).toBe(false);
        expect(isDebugOnlyAccountType('segwit', btcSymbol)).toBe(false);
        expect(isDebugOnlyAccountType('coinjoin', btcSymbol)).toBe(false);
        expect(isDebugOnlyAccountType('taproot', btcSymbol)).toBe(false);
        expect(isDebugOnlyAccountType('ledger', btcSymbol)).toBe(false);
        expect(isDebugOnlyAccountType('legacy', ethSymbol)).toBe(true);
        expect(isDebugOnlyAccountType('ledger', ethSymbol)).toBe(true);
        expect(isDebugOnlyAccountType('ledger', asNetworkSymbol('trx'))).toBe(true);
        expect(isDebugOnlyAccountType('normal', asNetworkSymbol('regtest'))).toBe(false);
        expect(isDebugOnlyAccountType('legacy', tsepSymbol)).toBe(true);
        expect(isDebugOnlyAccountType('legacy', asNetworkSymbol('thod'))).toBe(true);
    });

    it('returns no results when given an empty accounts array', () => {
        expect(runFilterReceiveAccouns({ accounts: [] })).toEqual([]);
    });

    it('returns no results when given a non-existing network in acccounts list', () => {
        expect(runFilterReceiveAccouns({ symbol: asNetworkSymbol('bsc') })).toEqual([]);
    });

    it('returns all accounts when debug mode is on', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: ethSymbol, accountType: 'normal' }),
            mockWalletAccount({ symbol: ethSymbol, accountType: 'ledger' }),
            mockWalletAccount({ symbol: ethSymbol, accountType: 'legacy' }),
        ];
        expect(runFilterReceiveAccouns({})).toEqual(filteredAccounts);
    });

    it('returns non-debug + non-empty accounts when debug mode is off', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: ethSymbol, accountType: 'normal' }),
            mockWalletAccount({ symbol: ethSymbol, accountType: 'ledger' }),
            mockWalletAccount({ symbol: ethSymbol, accountType: 'legacy' }),
        ];

        expect(runFilterReceiveAccouns({ isDebug: false })).toEqual(filteredAccounts);
    });

    it('returns no results when device is not the same', () => {
        expect(runFilterReceiveAccouns({ deviceState: '2ndTestnetAddress@device_id:0' })).toEqual(
            [],
        );
    });

    it('excludes coinjoin accounts for BTC network (also tests isAnotherNetwork and isCoinjoinAccount methods)', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: btcSymbol, accountType: 'ledger' }),
            mockWalletAccount({ symbol: btcSymbol, accountType: 'taproot' }),
            mockWalletAccount({ symbol: btcSymbol, accountType: 'segwit' }),
            mockWalletAccount({ symbol: btcSymbol, accountType: 'legacy' }),
        ];

        expect(runFilterReceiveAccouns({ symbol: btcSymbol })).toEqual(filteredAccounts);
    });

    it('returns account when when its either first normal account (no matter is empty or not visible) or it is not empty and visible', () => {
        const filteredAccounts = [
            mockWalletAccount({
                symbol: solSymbol,
                accountType: 'normal',
                empty: true,
                visible: false,
            }),
            mockWalletAccount({ symbol: solSymbol, accountType: 'ledger' }),
        ];

        expect(runFilterReceiveAccouns({ symbol: solSymbol })).toEqual(filteredAccounts);
    });

    it('returns both normal and legacy for sepolia', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: tsepSymbol, accountType: 'normal' }),
            mockWalletAccount({ symbol: tsepSymbol, accountType: 'legacy' }),
        ];

        expect(runFilterReceiveAccouns({ symbol: tsepSymbol })).toEqual(filteredAccounts);
    });

    it('returns non-debug + excludes testnet accounts when debug mode is off', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: tsepSymbol, accountType: 'normal' }),
            mockWalletAccount({ symbol: tsepSymbol, accountType: 'legacy' }),
        ];

        expect(runFilterReceiveAccouns({ isDebug: false })).toEqual(
            expect.not.arrayContaining(filteredAccounts),
        );
    });
});
