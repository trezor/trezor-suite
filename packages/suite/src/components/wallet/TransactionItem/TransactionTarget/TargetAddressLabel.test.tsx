import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialMetadataState } from '@suite/metadata';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import { type AccountTransaction } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TargetAddressLabel } from './TargetAddressLabel';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

type TransactionInput = AccountTransaction['details']['vin'][number];

// Public test vectors of BIP173 and of the addresses of utxo-lib.
const SENDER_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const RECEIVER_ADDRESS = '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr';

const getBitcoinAccount = (descriptor: string, address: string, index: number) =>
    mockWalletAccount({
        symbol: asNetworkSymbol('btc'),
        descriptor: asAccountDescriptor(descriptor),
        index,
        addresses: {
            change: [],
            used: [{ address, path: '', transfers: 1, balance: '0', sent: '0', received: '0' }],
            unused: [],
        },
    });

const senderAccount = getBitcoinAccount('zpubSender', SENDER_ADDRESS, 1);
const receiverAccount = getBitcoinAccount('zpubReceiver', RECEIVER_ADDRESS, 0);

const getTransfer = (
    type: AccountTransaction['type'],
    input: TransactionInput,
): AccountTransaction => ({
    type,
    txid: 'cc'.repeat(32),
    blockHeight: 100,
    amount: '9000',
    fee: '1000',
    targets: [{ n: 0, addresses: [RECEIVER_ADDRESS], isAddress: true, amount: '9000' }],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [input],
        vout: [{ n: 0, addresses: [RECEIVER_ADDRESS], isAddress: true, value: '9000' }],
        size: 200,
        totalInput: input.value ?? '0',
        totalOutput: '9000',
    },
});

const parentOutput = { txid: 'aa'.repeat(32), vout: 0, n: 0 };
const sent = enhanceTransaction(
    getTransfer('sent', {
        ...parentOutput,
        addresses: [SENDER_ADDRESS],
        isAddress: true,
        value: '10000',
    }),
    senderAccount,
);
// The Electrum backend gives the receiving account the input of the sender without its value.
const unresolvedReceived = enhanceTransaction(
    getTransfer('recv', { ...parentOutput, addresses: [], isAddress: false }),
    receiverAccount,
);

const renderTargetAddressLabel = (storedTransactions: AppState['wallet']['transactions']) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            metadata: initialMetadataState,
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [senderAccount, receiverAccount],
                transactions: storedTransactions,
            },
        },
    });
    const [target] = unresolvedReceived.targets;
    if (!target) throw new Error('Missing target');

    renderWithProviders(
        services,
        <TargetAddressLabel
            transaction={unresolvedReceived}
            target={target}
            accountKey={receiverAccount.key}
        />,
    );
};

describe('TargetAddressLabel', () => {
    it('labels a transfer with unresolved inputs by the account which sent it', () => {
        renderTargetAddressLabel({
            ...mockInitialAppState.wallet.transactions,
            transactions: {
                [senderAccount.key]: [sent],
                [receiverAccount.key]: [unresolvedReceived],
            },
        });

        expect(screen.getByTestId('@wallet/transaction/target-address')).toHaveTextContent(
            /Bitcoin #2/,
        );
    });

    it('shows the address of a transfer with unresolved inputs from outside the wallet', () => {
        renderTargetAddressLabel({
            ...mockInitialAppState.wallet.transactions,
            transactions: { [receiverAccount.key]: [unresolvedReceived] },
        });

        expect(screen.getByTestId('@wallet/transaction/target-address')).not.toHaveTextContent(
            /Bitcoin #/,
        );
    });
});
