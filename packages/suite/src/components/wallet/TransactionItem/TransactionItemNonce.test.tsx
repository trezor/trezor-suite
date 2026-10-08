import '@suite-common/test-utils/globalOverrides';
// Loaded first, as the app does: its modals import this component back.
import 'src/components/suite';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { EvmNonceInfo } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { EvmNonceInfoProvider } from 'src/hooks/wallet/transactions/EvmNonceInfoContext';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TransactionItem } from './TransactionItem';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { getAccountInfo: jest.fn() },
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

// A replaceable send of the account, still pending at nonce 8.
const pendingAtNonce8 = {
    type: 'sent',
    txid: '0xpending',
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    symbol: account.symbol,
    blockHeight: 0,
    blockTime: 1_700_000_000,
    amount: '0',
    fee: '21000000000000',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [{ n: 0, isAddress: true, isAccountOwned: true }], vout: [] },
    ethereumSpecific: { status: -1, nonce: 8, gasLimit: 21000 },
    rbfParams: { type: 'ethereum', txid: '0xpending', outputs: [], ethereumNonce: 8 },
} as unknown as WalletAccountTransaction;

const renderItem = (nonceInfo: EvmNonceInfo) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: { ...mockInitialAppState.wallet, accounts: [account] },
        },
    });

    return renderWithProviders(
        services,
        <EvmNonceInfoProvider value={{ nonceInfo }}>
            <TransactionItem
                transaction={pendingAtNonce8}
                isPending
                accountKey={account.key}
                network={getNetwork(account.symbol)}
                accountType={account.accountType}
                index={0}
            />
        </EvmNonceInfoProvider>,
    );
};

describe('TransactionItem nonce gating', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps a stuck nonce from being bumped, with the nonce the list provides', () => {
        renderItem({ confirmedNonce: 6, nextNonce: 7, pendingNonces: [6, 8], confirmedNonces: [] });

        expect(screen.getByTestId('@transaction-item/bump-fee-button')).toBeDisabled();
        expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
    });

    it('offers the bump when the provided nonce reaches the transaction', () => {
        renderItem({
            confirmedNonce: 6,
            nextNonce: 9,
            pendingNonces: [6, 7, 8],
            confirmedNonces: [],
        });

        expect(screen.getByTestId('@transaction-item/bump-fee-button')).toBeEnabled();
        expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
    });
});
