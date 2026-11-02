import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import {
    AppTabsRoutes,
    RootStackRoutes,
    type StakingPendingTxParams,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useStakingPendingTransaction } from './useStakingPendingTransaction';
import { type EarnFormDraftPrefix } from '../../types';

type MockTransaction = Pick<WalletAccountTransaction, 'txid' | 'blockHeight' | 'type'>;

const mockDispatch = jest.fn();
const mockNavigation = { dispatch: jest.fn() };
const mockOpenInBlockchain = jest.fn();
const mockBottomSheetRef = { current: null };
const mockFeeInfo = { blockTime: 12 };
let mockTransaction: MockTransaction | null = null;

jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ dispatch: mockDispatch }),
}));
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: (payload: unknown) => ({ type: 'test/fetch-account', payload }),
    selectAccountNetworkSymbol: () => 'eth',
    selectConvertedNetworkFeeInfo: () => mockFeeInfo,
    selectTransactionByAccountKeyAndTxid: () => mockTransaction,
}));
jest.mock('../earn/useEarnPendingTransactionSheet', () => ({
    useEarnPendingTransactionSheet: () => ({
        pendingBottomSheetRef: mockBottomSheetRef,
        isExploreDisabled: false,
        openInBlockchain: mockOpenInBlockchain,
    }),
}));

const accountKey = mockAccountKey({ descriptor: 'testAccountKey' });
const pendingTransaction: StakingPendingTxParams = {
    amountInBaseUnits: '1000000000000000000',
    fee: '21000',
    submittedAt: 1_700_000_000_000,
    txid: '0xabc',
};
const POLL_INTERVAL_MS = 6_000;

const renderPendingTransaction = (
    routeParam: StakingPendingTxParams | undefined,
    stakeType: EarnFormDraftPrefix = 'stake',
) =>
    renderHookWithStoreProvider(() =>
        useStakingPendingTransaction({ accountKey, pendingTransaction: routeParam, stakeType }),
    );

const homeRoutes = [
    { name: RootStackRoutes.AppTabs, params: { screen: AppTabsRoutes.EarnStack } },
    { name: RootStackRoutes.StakingManagement, params: { accountKey } },
];

describe('useStakingPendingTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockTransaction = null;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('is idle without a pushed transaction', async () => {
        const { result } = await renderPendingTransaction(undefined);
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    });

    it.each([
        ['is not in the store yet', null],
        ['is still unconfirmed', { txid: '0xabc', blockHeight: 0, type: 'sent' }],
    ] as const)(
        'polls the account and exposes the sheet while the transaction %s',
        async (_, transaction) => {
            mockTransaction = transaction;
            const { result } = await renderPendingTransaction(pendingTransaction);

            expect(result.current).toEqual({
                isPending: true,
                pendingModal: {
                    bottomSheetRef: mockBottomSheetRef,
                    isExploreDisabled: false,
                    onExplorePress: mockOpenInBlockchain,
                    pendingTransaction,
                },
            });

            await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS * 2));

            expect(mockDispatch).toHaveBeenCalledTimes(2);
            expect(mockDispatch).toHaveBeenCalledWith({
                type: 'test/fetch-account',
                payload: { accountKey },
            });
            expect(mockNavigation.dispatch).not.toHaveBeenCalled();
        },
    );

    it('resets to the complete screen once the transaction confirms', async () => {
        mockTransaction = { txid: '0xabc', blockHeight: 100, type: 'sent' };
        const { result } = await renderPendingTransaction(pendingTransaction, 'unstake');
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigation.dispatch).toHaveBeenCalledWith({
            type: 'RESET',
            payload: {
                index: 2,
                routes: [
                    ...homeRoutes,
                    {
                        name: RootStackRoutes.StakingTransactionComplete,
                        params: {
                            stakeType: 'unstake',
                            accountKey,
                            amountInBaseUnits: pendingTransaction.amountInBaseUnits,
                        },
                    },
                ],
            },
        });
    });

    it('opens the transaction detail when the confirmed transaction failed on-chain', async () => {
        mockTransaction = { txid: '0xabc', blockHeight: 100, type: 'failed' };
        await renderPendingTransaction(pendingTransaction);

        expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigation.dispatch).toHaveBeenCalledWith({
            type: 'RESET',
            payload: {
                index: 2,
                routes: [
                    ...homeRoutes,
                    {
                        name: RootStackRoutes.TransactionDetailStack,
                        params: {
                            screen: TransactionDetailStackRoutes.TransactionDetail,
                            params: { accountKey, txid: '0xabc', closeActionType: 'close' },
                        },
                    },
                ],
            },
        });
    });
});
