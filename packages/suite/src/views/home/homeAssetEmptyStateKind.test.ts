import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getHomeAssetEmptyStateKind } from './homeAssetEmptyStateKind';

const BTC = asNetworkSymbol('btc');

const heldAccount = mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' });
const emptyAccount = { ...mockWalletAccount({ symbol: BTC, formattedBalance: '0' }), empty: true };

describe('getHomeAssetEmptyStateKind', () => {
    // Accounts on turned-off networks are not in the list, so none on means none listed.
    it('asks to activate a network when none is on', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'exception', type: 'discovery-empty' },
                discoveryProgressStatus: undefined,
            }),
        ).toBe('noNetworkEnabled');
    });

    it('shows the table to a wallet holding something, whatever discovery says', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [heldAccount, emptyAccount],
                discoveryStatus: { status: 'exception', type: 'discovery-failed' },
                discoveryProgressStatus: undefined,
            }),
        ).toBeUndefined();
    });

    it('says discovery went wrong when the wallet has nothing to show for it', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'exception', type: 'discovery-failed' },
                discoveryProgressStatus: undefined,
            }),
        ).toBe('discoveryFailed');
    });

    it('says the device went away when the wallet has nothing to show for it', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'exception', type: 'device-unavailable' },
                discoveryProgressStatus: 'failed',
            }),
        ).toBe('deviceUnavailable');
    });

    it('says the passphrase entry was cancelled when that left the wallet with no accounts', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: undefined,
                discoveryProgressStatus: 'cancelled',
            }),
        ).toBe('passphraseCancelled');
    });

    it('holds the empty wallet back while discovery is still looking', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [emptyAccount],
                discoveryStatus: { status: 'loading', type: 'discovery' },
                discoveryProgressStatus: 'progress',
            }),
        ).toBe('loading');
    });

    it('offers to fund a wallet whose every account is empty', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [emptyAccount],
                discoveryStatus: undefined,
                discoveryProgressStatus: undefined,
            }),
        ).toBe('emptyWallet');
    });

    it('shows the table while an account that is not empty is still loading', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [{ ...heldAccount, empty: false }],
                discoveryStatus: { status: 'loading', type: 'discovery' },
                discoveryProgressStatus: 'progress',
            }),
        ).toBeUndefined();
    });
});
