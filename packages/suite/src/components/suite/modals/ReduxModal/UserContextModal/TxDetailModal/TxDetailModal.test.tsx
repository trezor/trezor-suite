import '@suite-common/test-utils/globalOverrides';

import { screen, waitFor } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { explorerInitialState } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import TrezorConnect, { type AccountTransaction } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { transactionsReducer } from 'src/reducers/wallet';
import { renderWithProviders, waitForRender } from 'src/support/test-utils/hooksHelper';

import { TxDetailModal } from './TxDetailModal';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

type TransactionInput = AccountTransaction['details']['vin'][number];

// Public test vectors of BIP173 and of the addresses of utxo-lib.
const RECEIVE_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
const CHANGE_ADDRESS = '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr';
const FOREIGN_ADDRESS = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';

const getAddress = (address: string, path: string) => ({
    address,
    path,
    transfers: 1,
    balance: '0',
    sent: '0',
    received: '0',
});

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('zpubReplaceable'),
    addresses: {
        change: [getAddress(CHANGE_ADDRESS, "m/84'/0'/0'/1/0")],
        used: [getAddress(RECEIVE_ADDRESS, "m/84'/0'/0'/0/0")],
        unused: [],
    },
});

const SENT_TXID = 'aa'.repeat(32);
const CHAINED_TXID = 'bb'.repeat(32);

const ownInput: TransactionInput = {
    txid: 'cc'.repeat(32),
    vout: 0,
    sequence: 4294967293,
    n: 0,
    addresses: [RECEIVE_ADDRESS],
    isAddress: true,
    isAccountOwned: true,
    value: '50000',
};

// A pending payment of the account whose change is spent by a pending chained transaction.
const sentTransaction: AccountTransaction = {
    type: 'sent',
    txid: SENT_TXID,
    hex: '0200',
    blockHeight: -1,
    amount: '30000',
    fee: '1000',
    feeRate: '5',
    vsize: 200,
    rbf: true,
    targets: [{ n: 0, addresses: [FOREIGN_ADDRESS], isAddress: true, amount: '30000' }],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [ownInput],
        vout: [
            { n: 0, addresses: [FOREIGN_ADDRESS], isAddress: true, value: '30000' },
            {
                n: 1,
                addresses: [CHANGE_ADDRESS],
                isAddress: true,
                isAccountOwned: true,
                value: '19000',
            },
        ],
        size: 250,
        totalInput: '50000',
        totalOutput: '49000',
    },
};

const unresolvedForeignInput: TransactionInput = {
    txid: 'dd'.repeat(32),
    vout: 0,
    sequence: 4294967293,
    n: 1,
    addresses: [],
    isAddress: false,
};

// The chained transaction spends the change together with a foreign output, so the Electrum
// backend gives it without the value of the foreign input and with a fee of 0.
const chainedTransaction: AccountTransaction = {
    type: 'joint',
    txid: CHAINED_TXID,
    blockHeight: -1,
    amount: '-19000',
    fee: '0',
    feeRate: '0',
    vsize: 200,
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [
            {
                txid: SENT_TXID,
                vout: 1,
                n: 0,
                addresses: [CHANGE_ADDRESS],
                isAddress: true,
                isAccountOwned: true,
                value: '19000',
            },
            unresolvedForeignInput,
        ],
        vout: [{ n: 0, addresses: [FOREIGN_ADDRESS], isAddress: true, value: '38000' }],
        size: 250,
        totalInput: '19000',
        totalOutput: '38000',
    },
};

const fullChainedTransaction: AccountTransaction = {
    ...chainedTransaction,
    type: 'unknown',
    fee: '2000',
    feeRate: '10',
    details: {
        ...chainedTransaction.details,
        vin: [
            { ...chainedTransaction.details.vin[0]!, isAccountOwned: undefined },
            { ...unresolvedForeignInput, addresses: [FOREIGN_ADDRESS], value: '21000' },
        ],
        totalInput: '40000',
    },
};

const renderTxDetailModal = (transactions: AccountTransaction[], txid = SENT_TXID) => {
    const preloadedState: AppState = {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            accounts: [account],
            explorer: explorerInitialState,
            transactions: {
                ...mockInitialAppState.wallet.transactions,
                transactions: {
                    [account.key]: transactions.map(tx => enhanceTransaction(tx, account)),
                },
            },
        },
    };
    const { services } = createTestCompositionRoot<void, AppState>({
        reducer: (state = preloadedState, action) => ({
            ...state,
            wallet: {
                ...state.wallet,
                transactions: transactionsReducer(state.wallet.transactions, action),
            },
        }),
        preloadedState,
    });

    renderWithProviders(
        services,
        <TxDetailModal
            txid={txid}
            descriptor={account.descriptor}
            symbol={account.symbol}
            deviceState={account.deviceState}
            flow="detail"
            showCancelButton
            onCancel={jest.fn()}
        />,
    );
};

const queryBumpFeeButton = () =>
    screen.queryByRole('button', { name: messages.TR_BUMP_FEE.defaultMessage });

const queryCancelButton = () =>
    screen.queryByRole('button', { name: messages.TR_CANCEL_TX.defaultMessage });

const mockGetTransactions = (response: () => Promise<unknown>) =>
    jest.mocked(TrezorConnect.blockchainGetTransactions).mockImplementation(response as never);

// A test failing before it answers would leave the request shared by the single-instance thunk
// pending for the next tests, so a pending response is answered after each test anyway.
let respondPending: (() => void) | undefined;

const mockPendingGetTransactions = (payload: AccountTransaction[]) => {
    mockGetTransactions(
        () =>
            new Promise(resolve => {
                respondPending = () => resolve({ success: true, payload });
            }),
    );

    return () => respondPending?.();
};

describe('TxDetailModal', () => {
    afterEach(async () => {
        respondPending?.();
        respondPending = undefined;
        await waitForRender();
        jest.clearAllMocks();
    });

    it('offers to bump the fee of a transaction without unresolved chained transactions', () => {
        renderTxDetailModal([sentTransaction]);

        expect(queryBumpFeeButton()).toBeInTheDocument();
        expect(queryCancelButton()).toBeInTheDocument();
        expect(TrezorConnect.blockchainGetTransactions).not.toHaveBeenCalled();
    });

    it('offers to bump the fee only once the fees of the chained transactions are known', async () => {
        const respond = mockPendingGetTransactions([fullChainedTransaction]);

        renderTxDetailModal([chainedTransaction, sentTransaction]);

        expect(queryBumpFeeButton()).not.toBeInTheDocument();
        expect(queryCancelButton()).not.toBeInTheDocument();
        expect(TrezorConnect.blockchainGetTransactions).toHaveBeenCalledWith({
            coin: 'btc',
            identity: undefined,
            txs: [CHAINED_TXID],
        });

        respond();

        await waitFor(() => expect(queryBumpFeeButton()).toBeInTheDocument());
        expect(queryCancelButton()).toBeInTheDocument();
    });

    it('does not offer to bump the fee when the fees of the chained transactions stay unknown', async () => {
        mockGetTransactions(() =>
            Promise.resolve({
                success: false,
                error: { message: 'Server error', code: 'Failure_UnknownCode' },
            }),
        );

        renderTxDetailModal([chainedTransaction, sentTransaction]);

        await waitFor(() =>
            expect(TrezorConnect.blockchainGetTransactions).toHaveBeenCalledTimes(1),
        );
        await waitForRender();

        expect(queryBumpFeeButton()).not.toBeInTheDocument();
        expect(queryCancelButton()).not.toBeInTheDocument();
    });

    describe('fee rate of a transaction with foreign inputs', () => {
        it('shows a spinner until the inputs are fetched', async () => {
            const respond = mockPendingGetTransactions([fullChainedTransaction]);

            renderTxDetailModal([chainedTransaction, sentTransaction], CHAINED_TXID);

            expect(screen.queryByTestId('@fee-rate/value')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('@spinner').length).toBeGreaterThan(0);

            respond();

            expect(await screen.findByTestId('@fee-rate/value')).toHaveTextContent('10.00');
            expect(screen.queryByText(messages.TR_UNKNOWN.defaultMessage)).not.toBeInTheDocument();
        });

        it('tells that the fee rate is unknown when the inputs cannot be fetched', async () => {
            mockGetTransactions(() =>
                Promise.resolve({
                    success: false,
                    error: { message: 'Server error', code: 'Failure_UnknownCode' },
                }),
            );

            renderTxDetailModal([chainedTransaction, sentTransaction], CHAINED_TXID);

            expect(await screen.findByText(messages.TR_UNKNOWN.defaultMessage)).toBeInTheDocument();
            expect(screen.queryByTestId('@fee-rate/value')).not.toBeInTheDocument();
        });
    });
});
