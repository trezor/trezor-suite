import { type Account } from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import TrezorConnect, { type AccountInfo } from '@trezor/connect';

import { isNewTronAccount } from './isNewTronAccount';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: { getAccountInfo: jest.fn() },
}));

const RECIPIENT_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';

const account = {
    symbol: 'trx',
    networkType: 'tron',
    deviceState: 'mock-device-state',
} as unknown as Account;

const buildTronResources = (overrides?: Partial<TronAccountExtraData>): TronAccountExtraData => ({
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 600,
    totalFreeBandwidth: 600,
    availableEnergy: 0,
    totalEnergy: 0,
    totalEnergyLimit: 0,
    totalEnergyWeight: 0,
    totalBandwidthLimit: 0,
    totalBandwidthWeight: 0,
    ...overrides,
});

const buildAccountInfo = (overrides?: Partial<AccountInfo>): AccountInfo => ({
    descriptor: RECIPIENT_ADDRESS,
    balance: '0',
    availableBalance: '0',
    empty: false,
    history: { total: 0, unconfirmed: 0 },
    ...overrides,
});

const mockGetAccountInfoSuccess = (accountInfo: AccountInfo) => {
    (TrezorConnect.getAccountInfo as jest.Mock).mockResolvedValue({
        success: true,
        payload: accountInfo,
    });
};

describe('isNewTronAccount', () => {
    it('returns false when no address is provided', async () => {
        expect(await isNewTronAccount('', account)).toBe(false);
        expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
    });

    it('returns false when account info cannot be fetched', async () => {
        (TrezorConnect.getAccountInfo as jest.Mock).mockResolvedValue({
            success: false,
            payload: { error: 'Network error' },
        });

        expect(await isNewTronAccount(RECIPIENT_ADDRESS, account)).toBe(false);
    });

    it('returns true for an address without any on-chain history', async () => {
        mockGetAccountInfoSuccess(buildAccountInfo({ empty: true }));

        expect(await isNewTronAccount(RECIPIENT_ADDRESS, account)).toBe(true);
    });

    it('returns true for a not activated address with TRC-20-only history', async () => {
        // Receiving TRC-20 tokens creates transaction history but does not
        // activate the account, so the free-bandwidth allotment was never granted
        mockGetAccountInfoSuccess(
            buildAccountInfo({
                empty: false,
                history: { total: 3, unconfirmed: 0 },
                misc: {
                    tronResources: buildTronResources({
                        availableFreeBandwidth: 0,
                        totalFreeBandwidth: 0,
                    }),
                },
            }),
        );

        expect(await isNewTronAccount(RECIPIENT_ADDRESS, account)).toBe(true);
    });

    it('returns false for an activated address', async () => {
        mockGetAccountInfoSuccess(
            buildAccountInfo({
                empty: false,
                balance: '1000000',
                availableBalance: '1000000',
                history: { total: 5, unconfirmed: 0 },
                misc: { tronResources: buildTronResources() },
            }),
        );

        expect(await isNewTronAccount(RECIPIENT_ADDRESS, account)).toBe(false);
    });

    it('returns false for an activated address with exhausted free bandwidth', async () => {
        // spending the daily free bandwidth zeroes availableFreeBandwidth
        // but the total allotment stays at 600 for every activated account
        mockGetAccountInfoSuccess(
            buildAccountInfo({
                empty: false,
                balance: '1000000',
                availableBalance: '1000000',
                history: { total: 5, unconfirmed: 0 },
                misc: { tronResources: buildTronResources({ availableFreeBandwidth: 0 }) },
            }),
        );

        expect(await isNewTronAccount(RECIPIENT_ADDRESS, account)).toBe(false);
    });
});
