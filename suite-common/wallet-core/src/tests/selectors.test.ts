import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type Account } from '@suite-common/wallet-types';

import { selectDiscoveryAccountsParam } from '../selectors';

const STATIC_SESSION_ID: `${string}@${string}:${number}` =
    'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@ABC123:1';
const DEVICE = mockSuiteDevice({ state: { staticSessionId: STATIC_SESSION_ID } });

const mockSolAccount = (override: Partial<Account>): Account =>
    ({
        symbol: 'sol',
        accountType: 'normal',
        index: 0,
        deviceState: STATIC_SESSION_ID,
        empty: false,
        visible: true,
        ...override,
    }) as unknown as Account;

const getState = (accounts: Account[]) =>
    ({
        wallet: {
            accounts,
            settings: { enabledNetworks: ['sol'] },
            blockchain: {},
        },
        device: { devices: [DEVICE], selectedDevice: DEVICE, persistentDeviceData: [] },
    }) as any;

const getSolKnown = (accounts: Account[]) =>
    selectDiscoveryAccountsParam(getState(accounts), STATIC_SESSION_ID).find(
        coin => coin.symbol === 'sol',
    )?.known;

describe('selectDiscoveryAccountsParam', () => {
    it('rediscovers from a failed account at the end of the chain', () => {
        expect(getSolKnown([mockSolAccount({ failed: true, empty: true })])).toEqual([
            { type: 'normal', skip: 0 },
        ]);
    });

    it('rediscovers from the first failed account even when it sits below other accounts', () => {
        expect(
            getSolKnown([
                mockSolAccount({ index: 0 }),
                mockSolAccount({ index: 1, failed: true, empty: true }),
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
                mockSolAccount({ accountType: 'ledger', index: 0, failed: true, empty: true }),
            ]),
        ).toEqual([{ type: 'normal' }, { type: 'ledger', skip: 0 }]);
    });
});
