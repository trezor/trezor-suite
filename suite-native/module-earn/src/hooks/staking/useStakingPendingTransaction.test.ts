import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    type TransactionsRootState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    AppTabsRoutes,
    RootStackRoutes,
    type StakingPendingTxParams,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { useStakingPendingTransaction } from './useStakingPendingTransaction';
import { type EarnFormDraftPrefix } from '../../types';

type MockTransaction = Pick<WalletAccountTransaction, 'txid' | 'blockHeight' | 'type'>;

const mockNavigation = { dispatch: jest.fn() };
const mockOpenInBlockchain = jest.fn();
const mockBottomSheetRef = { current: null };
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useIsFocused: () => true,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: (payload: unknown) => ({ type: 'test/fetch-account', payload }),
}));
jest.mock('../earn/useEarnPendingTransactionSheet', () => ({
    useEarnPendingTransactionSheet: () => ({
        pendingBottomSheetRef: mockBottomSheetRef,
        isExploreDisabled: false,
        openInBlockchain: mockOpenInBlockchain,
    }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const accountKey = account.key;
const pendingTransaction: StakingPendingTxParams = {
    amountInBaseUnits: '1000000000000000000',
    fee: '21000',
    submittedAt: 1_700_000_000_000,
    txid: '0xabc',
};
const POLL_INTERVAL_MS = 6_000;

type RenderPendingTransactionParams = {
    pendingTransaction?: StakingPendingTxParams;
    stakeType?: EarnFormDraftPrefix;
    transaction?: MockTransaction | null;
};

const renderPendingTransaction = async ({
    pendingTransaction: routeTransaction,
    stakeType = 'stake',
    transaction,
}: RenderPendingTransactionParams = {}) => {
    const store = createStoreFromPreloadedState<FeesRootState & TransactionsRootState>({
        wallet: {
            accounts: [account],
            fees: {
                eth: {
                    status: 'loaded',
                    data: {
                        blockTime: 12,
                        blockHeight: 0,
                        minFee: 0,
                        maxFee: 0,
                        minPriorityFee: 0,
                        levels: [],
                    },
                },
            },
            transactions: {
                ...transactionsInitialState,
                transactions: transaction
                    ? {
                          [accountKey]: [
                              testMocks.getWalletTransaction({
                                  descriptor: account.descriptor,
                                  deviceState: account.deviceState,
                                  symbol: account.symbol,
                                  ...transaction,
                              }),
                          ],
                      }
                    : {},
            },
        },
    });
    const { actions, dispatch } = createMockDispatch({ getState: store.getState });
    const rendered = await renderHookWithStoreProvider(
        () =>
            useStakingPendingTransaction({
                accountKey,
                pendingTransaction: routeTransaction,
                stakeType,
            }),
        { services: { store: { ...store, dispatch } } },
    );

    return { ...rendered, actions };
};

const homeRoutes = [
    { name: RootStackRoutes.AppTabs, params: { screen: AppTabsRoutes.EarnStack } },
    { name: RootStackRoutes.StakingManagement, params: { accountKey } },
];

describe('useStakingPendingTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('is idle without a pushed transaction', async () => {
        const { result, actions } = await renderPendingTransaction();
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(actions).toEqual([]);
        expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    });

    it.each([
        ['is not in the store yet', null],
        ['is still unconfirmed', { txid: '0xabc', blockHeight: 0, type: 'sent' }],
    ] as const)(
        'polls the account and exposes the sheet while the transaction %s',
        async (_, transaction) => {
            const { result, actions } = await renderPendingTransaction({
                pendingTransaction,
                transaction,
            });

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

            const refreshAccount = { type: 'test/fetch-account', payload: { accountKey } };

            expect(actions).toEqual([refreshAccount, refreshAccount]);
            expect(mockNavigation.dispatch).not.toHaveBeenCalled();
        },
    );

    it('resets to the complete screen once the transaction confirms', async () => {
        const { result, actions } = await renderPendingTransaction({
            pendingTransaction,
            stakeType: 'unstake',
            transaction: { txid: '0xabc', blockHeight: 100, type: 'sent' },
        });
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(actions).toEqual([]);
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
        await renderPendingTransaction({
            pendingTransaction,
            transaction: { txid: '0xabc', blockHeight: 100, type: 'failed' },
        });

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
