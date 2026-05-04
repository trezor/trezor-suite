import { explorerInitialState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { type WalletAccountTransaction, mockTransaction } from '@suite-native/tokens';

import { useTransactionDetails } from '../useTransactionDetails';

const mockOpenLink = jest.fn();

jest.mock('@suite-native/link', () => ({
    useOpenLink: () => mockOpenLink,
}));

const ACCOUNT_KEY = 'test-descriptor-btc-test-session' as AccountKey;
const TXID = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';
const TOKEN_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const confirmedTransaction: WalletAccountTransaction = { ...mockTransaction, txid: TXID };

const pendingTransaction: WalletAccountTransaction = {
    ...confirmedTransaction,
    blockHeight: 0,
};

const transactionWithToken: WalletAccountTransaction = {
    ...confirmedTransaction,
    symbol: 'eth',
    tokens: [
        {
            contract: TOKEN_CONTRACT,
            symbol: 'usdc',
            name: 'USDC',
            decimals: 6,
            amount: '1000000',
            from: '0xsender',
            to: '0xrecipient',
        },
    ],
} as unknown as WalletAccountTransaction;

const buildPreloadedState = (
    transactions: WalletAccountTransaction[] = [confirmedTransaction],
) => ({
    wallet: {
        transactions: {
            transactions: { [ACCOUNT_KEY]: transactions },
            fetchStatusDetail: {},
            phishing: {},
        },
        explorer: explorerInitialState,
    },
});

const renderUseTransactionDetails = (
    params: Parameters<typeof useTransactionDetails>[0],
    transactions?: WalletAccountTransaction[],
) =>
    renderHookWithStoreProvider(() => useTransactionDetails(params), {
        preloadedState: buildPreloadedState(transactions),
    });

describe('useTransactionDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('transaction', () => {
        it('returns undefined when accountKey is null', () => {
            const { result } = renderUseTransactionDetails({ accountKey: null, txid: TXID });

            expect(result.current.transaction).toBeUndefined();
        });

        it('returns undefined when txid is null', () => {
            const { result } = renderUseTransactionDetails({ accountKey: ACCOUNT_KEY, txid: null });

            expect(result.current.transaction).toBeUndefined();
        });

        it('returns the transaction matching accountKey and txid', () => {
            const { result } = renderUseTransactionDetails({ accountKey: ACCOUNT_KEY, txid: TXID });

            expect(result.current.transaction?.txid).toBe(TXID);
            expect(result.current.transaction?.symbol).toBe(mockTransaction.symbol);
        });

        it('returns null when no transaction matches the txid', () => {
            const { result } = renderUseTransactionDetails({
                accountKey: ACCOUNT_KEY,
                txid: 'nonexistent-txid',
            });

            expect(result.current.transaction).toBeNull();
        });
    });

    describe('isPending', () => {
        it('returns false for a confirmed transaction', () => {
            const { result } = renderUseTransactionDetails({ accountKey: ACCOUNT_KEY, txid: TXID });

            expect(result.current.isPending).toBe(false);
        });

        it('returns true for a pending transaction (blockHeight 0)', () => {
            const { result } = renderUseTransactionDetails(
                { accountKey: ACCOUNT_KEY, txid: TXID },
                [pendingTransaction],
            );

            expect(result.current.isPending).toBe(true);
        });

        it('returns false when accountKey is null', () => {
            const { result } = renderUseTransactionDetails({ accountKey: null, txid: TXID });

            expect(result.current.isPending).toBe(false);
        });
    });

    describe('tokenTransfer', () => {
        it('returns undefined when tokenContract is not provided', () => {
            const { result } = renderUseTransactionDetails({ accountKey: ACCOUNT_KEY, txid: TXID });

            expect(result.current.tokenTransfer).toBeUndefined();
        });

        it('returns the matching token transfer when tokenContract matches', () => {
            const { result } = renderUseTransactionDetails(
                { accountKey: ACCOUNT_KEY, txid: TXID, tokenContract: TOKEN_CONTRACT },
                [transactionWithToken],
            );

            expect(result.current.tokenTransfer?.contract).toBe(TOKEN_CONTRACT);
            expect(result.current.tokenTransfer?.symbol).toBe('usdc');
        });

        it('returns undefined when tokenContract does not match any token', () => {
            const { result } = renderUseTransactionDetails(
                { accountKey: ACCOUNT_KEY, txid: TXID, tokenContract: '0xnonexistent' },
                [transactionWithToken],
            );

            expect(result.current.tokenTransfer).toBeUndefined();
        });
    });

    describe('explorerUrl', () => {
        it('returns a URL containing the txid when transaction exists', () => {
            const { result } = renderUseTransactionDetails({ accountKey: ACCOUNT_KEY, txid: TXID });

            expect(result.current.explorerUrl).not.toBeNull();
            expect(result.current.explorerUrl).toContain(TXID);
        });

        it('returns null when transaction does not exist', () => {
            const { result } = renderUseTransactionDetails({
                accountKey: ACCOUNT_KEY,
                txid: 'nonexistent-txid',
            });

            expect(result.current.explorerUrl).toBeNull();
        });

        it('returns null when accountKey is null', () => {
            const { result } = renderUseTransactionDetails({ accountKey: null, txid: TXID });

            expect(result.current.explorerUrl).toBeNull();
        });
    });

    describe('openInBlockchain', () => {
        it('calls openLink with the explorerUrl when transaction exists', () => {
            const { result } = renderUseTransactionDetails({ accountKey: ACCOUNT_KEY, txid: TXID });

            act(() => {
                result.current.openInBlockchain();
            });

            expect(mockOpenLink).toHaveBeenCalledTimes(1);
            expect(mockOpenLink).toHaveBeenCalledWith(result.current.explorerUrl);
        });

        it('does not call openLink when transaction does not exist', () => {
            const { result } = renderUseTransactionDetails({
                accountKey: ACCOUNT_KEY,
                txid: 'nonexistent-txid',
            });

            act(() => {
                result.current.openInBlockchain();
            });

            expect(mockOpenLink).not.toHaveBeenCalled();
        });

        it('does not call openLink when accountKey is null', () => {
            const { result } = renderUseTransactionDetails({ accountKey: null, txid: TXID });

            act(() => {
                result.current.openInBlockchain();
            });

            expect(mockOpenLink).not.toHaveBeenCalled();
        });
    });
});
