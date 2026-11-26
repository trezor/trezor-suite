import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type TransactionsRootState,
    accountsInitialState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider } from '@trezor/dependency-injection';

import { YieldVaultDetailTransactions } from './YieldVaultDetailTransactions';

const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const mockVault = mockYieldVault();
let mockVaultTransactions: WalletAccountTransaction[] = [];
const mockTransactionList = jest.fn();
let mockIsHidingSuspicious = false;
const mockPhishingTxids = new Set<string>();

jest.mock('./useYieldVaultDetail', () => ({
    useYieldVaultDetail: () => ({ account: mockAccount, vault: mockVault }),
}));
jest.mock('#src/views/wallet/transactions/TransactionList/TransactionList', () => ({
    TransactionList: (props: unknown) => {
        mockTransactionList(props);

        return null;
    },
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountYieldVaultTransactions: () => mockVaultTransactions,
    fetchAllTransactionsForAccountThunk: () => ({ type: 'test/fetchAllTransactions' }),
    selectIsHideSuspiciousTransactions: () => mockIsHidingSuspicious,
    selectIsAccountTransactionPhishing: () => (_: string, transaction: WalletAccountTransaction) =>
        mockPhishingTxids.has(transaction.txid),
}));

const vaultTransaction = (txid: string, blockHeight: number) =>
    testMocks.getWalletTransaction({
        descriptor: mockAccount.descriptor,
        deviceState: mockAccount.deviceState,
        symbol: mockAccount.symbol,
        txid,
        blockHeight,
    });

const renderTransactions = () => {
    const { services } = createTestCompositionRoot<void, TransactionsRootState>({
        reducer: (
            state = {
                wallet: { transactions: transactionsInitialState, accounts: accountsInitialState },
            },
        ) => state,
    });

    return render(
        <Provider store={services.store}>
            <ServicesProvider services={services}>
                <YieldVaultDetailTransactions />
            </ServicesProvider>
        </Provider>,
    );
};

describe('YieldVaultDetailTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockVaultTransactions = [];
        mockIsHidingSuspicious = false;
        mockPhishingTxids.clear();
    });

    it('counts only confirmed transactions, since the list adds pending ones itself', () => {
        mockVaultTransactions = [
            vaultTransaction('0xpending', 0),
            ...Array.from({ length: 24 }, (_, index) =>
                vaultTransaction(`0xconfirmed${index}`, 21_000_000 - index),
            ),
        ];

        renderTransactions();

        expect(mockTransactionList).toHaveBeenLastCalledWith(
            expect.objectContaining({
                transactions: mockVaultTransactions,
                customTotalItems: 24,
            }),
        );
    });

    it('applies the hide-suspicious preference to the vault transactions', () => {
        const legit = vaultTransaction('0xlegit', 21_000_000);
        const scam = vaultTransaction('0xscam', 20_999_999);
        mockVaultTransactions = [legit, scam];
        mockPhishingTxids.add(scam.txid);

        renderTransactions();

        expect(mockTransactionList).toHaveBeenLastCalledWith(
            expect.objectContaining({ transactions: [legit, scam], customTotalItems: 2 }),
        );

        mockIsHidingSuspicious = true;
        mockTransactionList.mockClear();

        renderTransactions();

        expect(mockTransactionList).toHaveBeenLastCalledWith(
            expect.objectContaining({ transactions: [legit], customTotalItems: 1 }),
        );
    });

    it('keeps the list, and so its filter menu, when the preference hides every row', () => {
        const scam = vaultTransaction('0xscam', 21_000_000);
        mockVaultTransactions = [scam];
        mockPhishingTxids.add(scam.txid);
        mockIsHidingSuspicious = true;

        renderTransactions();

        expect(mockTransactionList).toHaveBeenLastCalledWith(
            expect.objectContaining({ transactions: [], customTotalItems: 0 }),
        );
    });

    it('renders nothing without vault transactions or older history to load', () => {
        const { container } = renderTransactions();

        expect(container).toBeEmptyDOMElement();
        expect(mockTransactionList).not.toHaveBeenCalled();
    });
});
