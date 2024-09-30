import { testMocks } from '@suite-common/test-utils';
import { Network, networksCollection } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import { isDebugOnlyAccountType, filterReceiveAccounts } from '../filterReceiveAccounts';

const { getSuiteDevice, getWalletAccount } = testMocks;

const accountsList: Account[] = [
    getWalletAccount({ symbol: 'eth', accountType: 'legacy' }),
    getWalletAccount({ symbol: 'eth', accountType: 'normal' }),
    getWalletAccount({ symbol: 'eth', accountType: 'ledger' }),
    getWalletAccount({ symbol: 'btc', accountType: 'coinjoin' }),
    getWalletAccount({ symbol: 'btc', accountType: 'taproot' }),
    getWalletAccount({ symbol: 'btc', accountType: 'legacy' }),
    getWalletAccount({ symbol: 'btc', accountType: 'segwit' }),
    getWalletAccount({ symbol: 'btc', accountType: 'ledger' }),
    getWalletAccount({ symbol: 'pol', accountType: 'legacy' }),
    getWalletAccount({ symbol: 'pol', accountType: 'normal' }),
    getWalletAccount({ symbol: 'pol', accountType: 'ledger' }),
    getWalletAccount({ symbol: 'sol', accountType: 'normal', empty: true, visible: false }),
    getWalletAccount({ symbol: 'sol', accountType: 'ledger' }),
    getWalletAccount({
        symbol: 'sol',
        accountType: 'ledger',
        empty: true,
        visible: false,
    }),
];

type RunFilterReceiveAccountsTestParams = {
    isDebug?: boolean;
    receiveNetwork?: string;
    deviceState?: `${string}@${string}:${number}`;
    accounts?: Account[];
};

const runFilterReceiveAccouns = ({
    isDebug = true,
    receiveNetwork = 'eth',
    deviceState = '1stTestnetAddress@device_id:0',
    accounts = accountsList,
}: RunFilterReceiveAccountsTestParams) => {
    const device = getSuiteDevice({
        unavailableCapabilities: {
            dash: 'no-support',
        },
        state: deviceState,
    });
    const unavailableCapabilities = device?.unavailableCapabilities ?? {};

    const receiveNetworks = networksCollection.filter(
        (n: Network) =>
            n.symbol === receiveNetwork &&
            !unavailableCapabilities[n.symbol] &&
            ((n.isDebugOnlyNetwork && isDebug) || !n.isDebugOnlyNetwork),
    );

    return filterReceiveAccounts({
        accounts,
        deviceState: device.state,
        receiveNetwork,
        isDebug,
        receiveNetworks,
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
        expect(isDebugOnlyAccountType('normal', 'regtest')).toBe(false);
    });

    it('returns no results when given an empty accounts array', () => {
        expect(runFilterReceiveAccouns({ accounts: [] })).toEqual([]);
    });

    it('returns no results when given a non-existing network in acccounts list', () => {
        expect(runFilterReceiveAccouns({ receiveNetwork: 'bnb' })).toEqual([]);
    });

    it('returns all accounts when debug mode is on', () => {
        const filteredAccounts = [
            getWalletAccount({ symbol: 'eth', accountType: 'legacy' }),
            getWalletAccount({ symbol: 'eth', accountType: 'normal' }),
            getWalletAccount({ symbol: 'eth', accountType: 'ledger' }),
        ];
        expect(runFilterReceiveAccouns({})).toEqual(filteredAccounts);
    });

    it('returns only non-debug accounts when debug mode is off', () => {
        const filteredAccounts = [getWalletAccount({ symbol: 'eth', accountType: 'normal' })];

        expect(runFilterReceiveAccouns({ isDebug: false })).toEqual(filteredAccounts);
    });

    it('returns no results when device is not the same', () => {
        expect(runFilterReceiveAccouns({ deviceState: '2ndTestnetAddress@device_id:0' })).toEqual(
            [],
        );
    });

    it('excludes coinjoin accounts for BTC network (also tests isAnotherNetwork and isCoinjoinAccount methods)', () => {
        const filteredAccounts = [
            getWalletAccount({ symbol: 'btc', accountType: 'taproot' }),
            getWalletAccount({ symbol: 'btc', accountType: 'legacy' }),
            getWalletAccount({ symbol: 'btc', accountType: 'segwit' }),
            getWalletAccount({ symbol: 'btc', accountType: 'ledger' }),
        ];

        expect(runFilterReceiveAccouns({ receiveNetwork: 'btc' })).toEqual(filteredAccounts);
    });

    it('returns account when when its either first normal account (no matter is empty or not visible) or it is not empty and visible', () => {
        const filteredAccounts = [
            getWalletAccount({ symbol: 'sol', accountType: 'normal', empty: true, visible: false }),
            getWalletAccount({ symbol: 'sol', accountType: 'ledger' }),
        ];

        expect(runFilterReceiveAccouns({ receiveNetwork: 'sol' })).toEqual(filteredAccounts);
    });
});
