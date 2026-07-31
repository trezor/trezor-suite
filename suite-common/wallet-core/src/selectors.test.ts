import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountFailureSpecific,
    type DiscoveryStatus,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { blockchainInitialState } from './blockchain/blockchainReducer';
import {
    type WalletCoreCompoundRootState,
    selectDiscoveryAccountsParam,
    selectShouldRediscover,
} from './selectors';
import { initialWalletSettingsState } from './settings/walletSettingsReducer';

const STATIC_SESSION_ID: `${string}@${string}:${number}` =
    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@ABC123:1';
const DEVICE_PATH = 'device-path';

const mockSolAccount = (
    account: Omit<Partial<Account>, 'failed' | 'error'>,
    accountFailure: AccountFailureSpecific = { failed: false },
) =>
    mockWalletAccount(
        {
            symbol: 'sol',
            deviceState: STATIC_SESSION_ID,
            ...account,
        },
        undefined,
        accountFailure,
    );

const mockDeviceWithPathAndState = (device?: Partial<TrezorDevice>) =>
    mockSuiteDevice({
        path: DEVICE_PATH,
        discovered: true,
        state: { staticSessionId: STATIC_SESSION_ID },
        ...device,
    });

type GetStateOptions = {
    accounts?: Account[];
    device?: TrezorDevice;
    discovery?: DiscoveryStatus;
    enabledNetworks?: NetworkSymbol[];
};

const getState = ({
    accounts = [],
    device = mockDeviceWithPathAndState(),
    discovery,
    enabledNetworks = ['sol'],
}: GetStateOptions = {}): WalletCoreCompoundRootState => ({
    wallet: {
        accounts,
        settings: { ...initialWalletSettingsState, enabledNetworks },
        blockchain: blockchainInitialState,
        discovery: discovery ? { [device.path]: discovery } : {},
    },
    device: {
        devices: [device],
        selectedDevice: device,
        persistentDeviceData: [],
    },
});

const getSolKnown = (accounts: Account[]) =>
    selectDiscoveryAccountsParam(getState({ accounts }), STATIC_SESSION_ID).find(
        coin => coin.symbol === 'sol',
    )?.known;

describe(selectDiscoveryAccountsParam.name, () => {
    it('rediscovers from a failed account at the end of the chain', () => {
        expect(
            getSolKnown([mockSolAccount({ empty: true }, { failed: true, error: 'Failed.' })]),
        ).toEqual([{ type: 'normal', skip: 0 }]);
    });

    it('rediscovers from the first failed account even when it sits below other accounts', () => {
        expect(
            getSolKnown([
                mockSolAccount({ index: 0 }),
                mockSolAccount({ index: 1, empty: true }, { failed: true, error: 'Failed.' }),
                mockSolAccount({ index: 2 }),
                mockSolAccount({ index: 3, empty: true, visible: false }),
            ]),
        ).toEqual([{ type: 'normal', skip: 1 }]);
    });

    it('continues discovery after the last used account when nothing failed', () => {
        expect(getSolKnown([mockSolAccount({ index: 0 })])).toEqual([{ type: 'normal', skip: 1 }]);
    });

    it('skips a completely discovered account type', () => {
        expect(
            getSolKnown([
                mockSolAccount({ index: 0 }),
                mockSolAccount({ index: 1, empty: true, visible: false }),
            ]),
        ).toEqual([{ type: 'normal' }]);
    });

    it('handles each account type independently', () => {
        expect(
            getSolKnown([
                mockSolAccount({ index: 0, empty: true }),
                mockSolAccount(
                    { accountType: 'ledger', index: 0, empty: true },
                    { failed: true, error: 'Failed.' },
                ),
            ]),
        ).toEqual([{ type: 'normal' }, { type: 'ledger', skip: 0 }]);
    });
});

describe(selectShouldRediscover.name, () => {
    it('returns false while discovery is in progress', () => {
        const device = mockDeviceWithPathAndState();

        expect(
            selectShouldRediscover(
                getState({
                    device,
                    discovery: { status: 'progress', total: 1, progress: 0 },
                }),
                device,
            ),
        ).toBe(false);
    });

    it('returns true when the device has no static session id', () => {
        const device = mockDeviceWithPathAndState({ state: undefined });
        expect(selectShouldRediscover(getState({ device }), device)).toBe(true);
    });

    it('returns true when the device is not discovered yet', () => {
        const device = mockDeviceWithPathAndState({ discovered: false });
        expect(selectShouldRediscover(getState({ device }), device)).toBe(true);
    });

    it('returns true when an enabled network has no known accounts yet', () => {
        const device = mockDeviceWithPathAndState();
        expect(selectShouldRediscover(getState({ device }), device)).toBe(true);
    });

    it('returns true when the last known account is used', () => {
        const device = mockDeviceWithPathAndState();
        expect(
            selectShouldRediscover(
                getState({
                    device,
                    accounts: [mockSolAccount({ index: 0, empty: false })],
                }),
                device,
            ),
        ).toBe(true);
    });

    it('returns false when the account chain is already fully discovered', () => {
        const device = mockDeviceWithPathAndState();
        expect(
            selectShouldRediscover(
                getState({
                    device,
                    accounts: [
                        mockSolAccount({ index: 0, empty: false }),
                        mockSolAccount({ index: 1, empty: true, visible: false }),
                    ],
                }),
                device,
            ),
        ).toBe(false);
    });
});
