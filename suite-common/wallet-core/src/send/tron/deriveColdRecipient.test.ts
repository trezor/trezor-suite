import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { deriveTronColdRecipient } from './deriveColdRecipient';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: { tronGetAddress: jest.fn() },
}));

const DEVICE_STATE = 'device-a' as Account['deviceState'];
const DERIVED_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const trxSymbol = asNetworkSymbol('trx');
const ethSymbol = asNetworkSymbol('eth');
const network = getNetwork(trxSymbol);
const device = { state: DEVICE_STATE } as unknown as Parameters<
    typeof deriveTronColdRecipient
>[0]['device'];

const buildAccount = (overrides?: Partial<Account>): Account =>
    ({
        symbol: trxSymbol,
        networkType: 'tron',
        accountType: 'normal',
        deviceState: DEVICE_STATE,
        index: 0,
        empty: false,
        descriptor: 'TWarmAccountDescriptorAddressPlaceholder',
        ...overrides,
    }) as unknown as Account;

const mockGetAddressSuccess = () => {
    (TrezorConnect.tronGetAddress as jest.Mock).mockResolvedValue({
        success: true,
        payload: { address: DERIVED_ADDRESS },
    });
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('deriveTronColdRecipient', () => {
    it('reuses a discovered empty account without a device round-trip', async () => {
        const account = buildAccount({ index: 0, empty: false });
        const emptyAccount = buildAccount({
            index: 1,
            empty: true,
            descriptor: 'TEmptyColdAddress1111111111111111111' as Account['descriptor'],
        });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account, emptyAccount],
            device: undefined,
        });

        expect(result).toBe(emptyAccount.descriptor);
        expect(TrezorConnect.tronGetAddress).not.toHaveBeenCalled();
    });

    it('picks the highest-index empty account when several are empty', async () => {
        const account = buildAccount({ index: 0, empty: false });
        const emptyLow = buildAccount({
            index: 1,
            empty: true,
            descriptor: 'TEmptyLowIndexAddress1111111111111111' as Account['descriptor'],
        });
        const emptyHigh = buildAccount({
            index: 3,
            empty: true,
            descriptor: 'TEmptyHighIndexAddress111111111111111' as Account['descriptor'],
        });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account, emptyLow, emptyHigh],
            device: undefined,
        });

        expect(result).toBe(emptyHigh.descriptor);
        expect(TrezorConnect.tronGetAddress).not.toHaveBeenCalled();
    });

    it('ignores empty accounts from another wallet and derives at highest index + 1', async () => {
        mockGetAddressSuccess();
        const account = buildAccount({ index: 0, empty: false });
        const warmAccount = buildAccount({ index: 1, empty: false });
        const foreignEmpty = buildAccount({
            index: 5,
            empty: true,
            deviceState: 'device-b' as Account['deviceState'],
            descriptor: 'TForeignEmptyAddress11111111111111111' as Account['descriptor'],
        });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account, warmAccount, foreignEmpty],
            device,
        });

        expect(result).toBe(DERIVED_ADDRESS);
        expect(TrezorConnect.tronGetAddress).toHaveBeenCalledTimes(1);
        expect((TrezorConnect.tronGetAddress as jest.Mock).mock.calls[0][0]).toMatchObject({
            path: "m/44'/195'/0'/0/2",
        });
    });

    it('ignores failed discovery accounts flagged empty and falls back to the device', async () => {
        mockGetAddressSuccess();
        const account = buildAccount({ index: 0, empty: false });
        const failedAccount = buildAccount({
            index: 1,
            empty: true,
            failed: true,
            error: 'discovery failed',
            descriptor: 'failed:1:trx:normal' as Account['descriptor'],
        });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account, failedAccount],
            device,
        });

        expect(result).toBe(DERIVED_ADDRESS);
        expect((TrezorConnect.tronGetAddress as jest.Mock).mock.calls[0][0]).toMatchObject({
            path: "m/44'/195'/0'/0/2",
        });
    });

    it('falls back to the device when only warm accounts exist', async () => {
        mockGetAddressSuccess();
        const account = buildAccount({ index: 0, empty: false });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account],
            device,
        });

        expect(result).toBe(DERIVED_ADDRESS);
        expect(TrezorConnect.tronGetAddress).toHaveBeenCalledTimes(1);
    });

    it('derives above the source account index when the accounts list is omitted', async () => {
        mockGetAddressSuccess();
        const account = buildAccount({ index: 2, empty: false });

        const result = await deriveTronColdRecipient({
            account,
            network,
            device,
        });

        expect(result).toBe(DERIVED_ADDRESS);
        expect((TrezorConnect.tronGetAddress as jest.Mock).mock.calls[0][0]).toMatchObject({
            path: "m/44'/195'/0'/0/3",
        });
    });

    it('returns undefined when no empty account exists and no device is available', async () => {
        const account = buildAccount({ index: 0, empty: false });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account],
            device: undefined,
        });

        expect(result).toBeUndefined();
        expect(TrezorConnect.tronGetAddress).not.toHaveBeenCalled();
    });

    it('returns undefined for a non-tron account without touching the device', async () => {
        const account = buildAccount({ networkType: 'ethereum', symbol: ethSymbol });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account],
            device,
        });

        expect(result).toBeUndefined();
        expect(TrezorConnect.tronGetAddress).not.toHaveBeenCalled();
    });

    it('returns undefined when the device derivation fails', async () => {
        (TrezorConnect.tronGetAddress as jest.Mock).mockResolvedValue({
            success: false,
            payload: { error: 'device error' },
        });
        const account = buildAccount({ index: 0, empty: false });

        const result = await deriveTronColdRecipient({
            account,
            network,
            accounts: [account],
            device,
        });

        expect(result).toBeUndefined();
    });
});
