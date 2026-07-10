import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    type AccountType,
    type NetworkAccount,
    asNetworkSymbol,
} from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { prepareNewAccountPayload } from './accountUtils';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        getAccountInfo: jest.fn(),
        cardanoGetPublicKey: jest.fn(),
        getPublicKey: jest.fn(),
    },
}));

const mockGetAccountInfo = TrezorConnect.getAccountInfo as jest.Mock;
const mockCardanoGetPublicKey = TrezorConnect.cardanoGetPublicKey as jest.Mock;
const mockGetPublicKey = TrezorConnect.getPublicKey as jest.Mock;

const device = mockSuiteDevice({ state: { staticSessionId: 'session@device:0' } });

const callPayload = (accountType: AccountType, networkSymbol: 'ada' | 'btc', bip43Path: string) =>
    prepareNewAccountPayload({
        accountType,
        networkSymbol: asNetworkSymbol(networkSymbol),
        index: 0,
        selectedAccount: { bip43Path } as NetworkAccount,
        device,
    });

beforeEach(() => {
    mockGetAccountInfo.mockReset();
    mockGetAccountInfo.mockResolvedValue({
        success: true,
        payload: { descriptor: 'descriptor', empty: true },
    });
    mockCardanoGetPublicKey.mockReset();
    mockCardanoGetPublicKey.mockResolvedValue({ success: true, payload: { xpub: 'xpub' } });
    mockGetPublicKey.mockReset();
    mockGetPublicKey.mockResolvedValue({
        success: true,
        payload: { xpub: 'xpub', xpubSegwit: 'xpubSegwit' },
    });
});

describe('prepareNewAccountPayload derivationType', () => {
    // Cardano derives a different key per account type; cardanoGetPublicKey defaults to
    // ICARUS_TREZOR (2) when derivationType is omitted, so a fresh `normal` ADA account must be
    // derived with ICARUS (1) to stay consistent with discovery and selectAccount's on-device verify.
    it.each<[AccountType, number]>([
        ['normal', 1], // ICARUS
        ['legacy', 2], // ICARUS_TREZOR
        ['ledger', 0], // LEDGER
    ])('passes derivationType %s -> %i for Cardano', async (accountType, expected) => {
        await callPayload(accountType, 'ada', "m/1852'/1815'/i'");

        expect(mockCardanoGetPublicKey).toHaveBeenCalledTimes(1);
        expect(mockCardanoGetPublicKey).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'ada', derivationType: expected }),
        );
    });

    it('leaves derivationType undefined for non-Cardano networks', async () => {
        await callPayload('normal', 'btc', "m/84'/0'/i'");

        expect(mockGetPublicKey).toHaveBeenCalledTimes(1);
        expect(mockGetPublicKey.mock.calls[0][0].derivationType).toBeUndefined();
    });
});
