import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { filterReceiveAccounts, isDebugOnlyAccountType } from '../filterReceiveAccounts';

const accountsList: Account[] = [
    mockWalletAccount({ symbol: 'eth', accountType: 'legacy' }),
    mockWalletAccount({ symbol: 'eth', accountType: 'normal' }),
    mockWalletAccount({ symbol: 'eth', accountType: 'ledger' }),
    mockWalletAccount({ symbol: 'btc', accountType: 'coinjoin' }),
    mockWalletAccount({ symbol: 'btc', accountType: 'taproot' }),
    mockWalletAccount({ symbol: 'btc', accountType: 'legacy' }),
    mockWalletAccount({ symbol: 'btc', accountType: 'segwit' }),
    mockWalletAccount({ symbol: 'btc', accountType: 'ledger' }),
    mockWalletAccount({ symbol: 'pol', accountType: 'legacy' }),
    mockWalletAccount({ symbol: 'pol', accountType: 'normal' }),
    mockWalletAccount({ symbol: 'pol', accountType: 'ledger' }),
    mockWalletAccount({ symbol: 'sol', accountType: 'normal', empty: true, visible: false }),
    mockWalletAccount({ symbol: 'sol', accountType: 'ledger' }),
    mockWalletAccount({
        symbol: 'sol',
        accountType: 'ledger',
        empty: true,
        visible: false,
    }),
];

type RunFilterReceiveAccountsTestParams = {
    isDebug?: boolean;
    symbol?: NetworkSymbol;
    deviceState?: `${string}@${string}:${number}`;
    accounts?: Account[];
};

const runFilterReceiveAccouns = ({
    isDebug = true,
    symbol = 'eth',
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
        expect(isDebugOnlyAccountType('legacy', 'btc')).toBe(false);
        expect(isDebugOnlyAccountType('segwit', 'btc')).toBe(false);
        expect(isDebugOnlyAccountType('coinjoin', 'btc')).toBe(false);
        expect(isDebugOnlyAccountType('taproot', 'btc')).toBe(false);
        expect(isDebugOnlyAccountType('ledger', 'btc')).toBe(false);
        expect(isDebugOnlyAccountType('legacy', 'eth')).toBe(true);
        expect(isDebugOnlyAccountType('ledger', 'eth')).toBe(true);
        expect(isDebugOnlyAccountType('legacy', 'tsep')).toBe(true);
        expect(isDebugOnlyAccountType('legacy', 'thod')).toBe(true);
        expect(isDebugOnlyAccountType('normal', 'regtest')).toBe(false);
    });

    it('returns no results when given an empty accounts array', () => {
        expect(runFilterReceiveAccouns({ accounts: [] })).toEqual([]);
    });

    it('returns no results when given a non-existing network in acccounts list', () => {
        expect(runFilterReceiveAccouns({ symbol: 'bsc' })).toEqual([]);
    });

    it('returns all accounts when debug mode is on', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: 'eth', accountType: 'normal' }),
            mockWalletAccount({ symbol: 'eth', accountType: 'ledger' }),
            mockWalletAccount({ symbol: 'eth', accountType: 'legacy' }),
        ];
        expect(runFilterReceiveAccouns({})).toEqual(filteredAccounts);
    });

    it('returns non-debug + non-empty accounts when debug mode is off', () => {
        const filteredAccounts = [
            mockWalletAccount({ symbol: 'eth', accountType: 'normal' }),
            mockWalletAccount({ symbol: 'eth', accountType: 'ledger' }),
            mockWalletAccount({ symbol: 'eth', accountType: 'legacy' }),
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
            mockWalletAccount({ symbol: 'btc', accountType: 'ledger' }),
            mockWalletAccount({ symbol: 'btc', accountType: 'taproot' }),
            mockWalletAccount({ symbol: 'btc', accountType: 'segwit' }),
            mockWalletAccount({ symbol: 'btc', accountType: 'legacy' }),
        ];

        expect(runFilterReceiveAccouns({ symbol: 'btc' })).toEqual(filteredAccounts);
    });

    it('returns account when when its either first normal account (no matter is empty or not visible) or it is not empty and visible', () => {
        const filteredAccounts = [
            mockWalletAccount({
                symbol: 'sol',
                accountType: 'normal',
                empty: true,
                visible: false,
            }),
            mockWalletAccount({ symbol: 'sol', accountType: 'ledger' }),
        ];

        expect(runFilterReceiveAccouns({ symbol: 'sol' })).toEqual(filteredAccounts);
    });
});
