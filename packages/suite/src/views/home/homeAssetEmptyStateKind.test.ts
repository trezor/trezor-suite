import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getHomeAssetEmptyStateKind } from './homeAssetEmptyStateKind';

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');
const SOL = asNetworkSymbol('sol');

const heldAccount = mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' });
const emptyAccount = { ...mockWalletAccount({ symbol: BTC, formattedBalance: '0' }), empty: true };
const failedAccount = mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' }, undefined, {
    failed: true,
    error: 'Network request failed',
});
const tokenOnlyAccount = (symbol: typeof ETH | typeof SOL) =>
    mockWalletAccount({
        symbol,
        formattedBalance: '0',
        tokens: [
            {
                standard: symbol === SOL ? 'SPL' : 'ERC20',
                contract: 'token-contract',
                balance: '10',
                decimals: 6,
            },
        ],
    });

describe('getHomeAssetEmptyStateKind', () => {
    it('asks to activate a network when none is on', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'exception', type: 'discovery-empty' },
                discoveryRunStatus: undefined,
            }),
        ).toBe('noNetworkEnabled');
    });

    it('shows the table to a wallet holding something, whatever discovery says', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [heldAccount, emptyAccount],
                discoveryStatus: { status: 'exception', type: 'discovery-failed' },
                discoveryRunStatus: undefined,
            }),
        ).toBeUndefined();
    });

    it('says discovery went wrong when the wallet has nothing to show for it', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'exception', type: 'discovery-failed' },
                discoveryRunStatus: undefined,
            }),
        ).toBe('discoveryFailed');
    });

    it('says the device went away when the wallet has nothing to show for it', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'exception', type: 'device-unavailable' },
                discoveryRunStatus: 'failed',
            }),
        ).toBe('deviceUnavailable');
    });

    it('says the passphrase entry was cancelled when that left the wallet with no accounts', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: undefined,
                discoveryRunStatus: 'cancelled',
            }),
        ).toBe('passphraseCancelled');
    });

    it('holds the empty wallet back while discovery is still looking', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [emptyAccount],
                discoveryStatus: { status: 'loading', type: 'discovery' },
                discoveryRunStatus: 'progress',
            }),
        ).toBe('loading');
    });

    it('offers to fund a wallet whose every account is empty', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [emptyAccount],
                discoveryStatus: undefined,
                discoveryRunStatus: undefined,
            }),
        ).toBe('emptyWallet');
    });

    it('shows the table while an account that is not empty is still loading', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [heldAccount],
                discoveryStatus: { status: 'loading', type: 'discovery' },
                discoveryRunStatus: 'progress',
            }),
        ).toBeUndefined();
    });

    it('shows the table to a wallet holding only tokens on Ethereum', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [emptyAccount, tokenOnlyAccount(ETH)],
                discoveryStatus: undefined,
                discoveryRunStatus: 'complete',
            }),
        ).toBeUndefined();
    });

    it('shows the table to a wallet holding only tokens on Solana', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [emptyAccount, tokenOnlyAccount(SOL)],
                discoveryStatus: undefined,
                discoveryRunStatus: 'complete',
            }),
        ).toBeUndefined();
    });

    it('holds the skeleton while the only account with a balance failed and discovery goes on', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [failedAccount],
                discoveryStatus: { status: 'loading', type: 'discovery' },
                discoveryRunStatus: 'progress',
            }),
        ).toBe('loading');
    });

    it('holds the skeleton while discovery has not found any account yet', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [],
                discoveryStatus: { status: 'loading', type: 'discovery' },
                discoveryRunStatus: 'progress',
            }),
        ).toBe('loading');
    });

    it('shows the table to a wallet holding something when the device went away', () => {
        expect(
            getHomeAssetEmptyStateKind({
                accounts: [heldAccount],
                discoveryStatus: { status: 'exception', type: 'device-unavailable' },
                discoveryRunStatus: 'failed',
            }),
        ).toBeUndefined();
    });
});
