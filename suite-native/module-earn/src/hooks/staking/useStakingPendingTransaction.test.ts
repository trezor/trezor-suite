import { combineReducers } from '@reduxjs/toolkit';
import { getDefaultStore } from 'jotai';

import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    feesReducer,
    fetchAndUpdateAccountThunk,
    prepareTransactionsReducer,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type FeesState, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type Alert, alertAtom, hideAlertAtom, showAlertAtom } from '@suite-native/alerts';
import {
    AppTabsRoutes,
    RootStackRoutes,
    type StakingPendingTxParams,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { useStakingPendingTransaction } from './useStakingPendingTransaction';
import { type EarnFormDraftPrefix } from '../../types';

type MockTransaction = Pick<WalletAccountTransaction, 'txid' | 'blockHeight' | 'type' | 'deadline'>;

const mockNavigation = { dispatch: jest.fn() };
const mockOpenInBlockchain = jest.fn();
const mockPendingSheet = jest.fn();
const mockBottomSheetRef = { current: null };
let mockIsFocused = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useIsFocused: () => mockIsFocused,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: jest.fn((payload: unknown) => ({
        type: 'test/fetch-account',
        payload,
    })),
}));
jest.mock('../earn/useEarnPendingTransactionSheet', () => ({
    useEarnPendingTransactionSheet: (params: unknown) => {
        mockPendingSheet(params);

        return {
            pendingBottomSheetRef: mockBottomSheetRef,
            isExploreDisabled: false,
            openInBlockchain: mockOpenInBlockchain,
        };
    },
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const accountKey = account.key;
const fetchAccount = jest.mocked(fetchAndUpdateAccountThunk);
const getAlert = () => getDefaultStore().get(alertAtom);
const pendingTransaction: StakingPendingTxParams = {
    amountInBaseUnits: '1000000000000000000',
    fee: '21000',
    submittedAt: 1_700_000_000_000,
    txid: '0xabc',
};
const POLL_INTERVAL_MS = 6_000;
const MISSING_TRANSACTION_GRACE_MS = 120_000;

const transactionsReducer = prepareTransactionsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadTransactions: mockReducer() },
});
const fees: FeesState = {
    eth: {
        status: 'loaded',
        data: {
            blockHeight: 0,
            blockTime: 12,
            minFee: 0,
            maxFee: 0,
            minPriorityFee: 0,
            levels: [],
        },
    },
};

type RenderPendingTransactionParams = {
    pendingTransaction?: StakingPendingTxParams;
    stakeType?: EarnFormDraftPrefix;
    transaction?: MockTransaction | null;
};

const renderPendingTransaction = async ({
    pendingTransaction: routeTransaction,
    stakeType = 'stake',
    transaction: initialTransaction,
}: RenderPendingTransactionParams = {}) => {
    const store = createLightStore({
        reducer: {
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                    addressDisplayType: 'chunked',
                }),
                accounts: createStaticReducer([account]),
                fees: feesReducer,
                transactions: transactionsReducer,
            }),
        },
        preloadedState: { wallet: { fees } },
    });
    const updateTransaction = (transaction: MockTransaction | null) => {
        if (!transaction) {
            store.dispatch(
                transactionsActions.removeTransaction({
                    account,
                    txs: [{ txid: pendingTransaction.txid }],
                }),
            );

            return;
        }

        const fixture = testMocks.getWalletTransaction({
            descriptor: account.descriptor,
            deviceState: account.deviceState,
            symbol: account.symbol,
            ...transaction,
        });
        store.dispatch(transactionsActions.addTransaction({ account, transactions: [fixture] }));
    };

    if (initialTransaction) updateTransaction(initialTransaction);

    return {
        ...(await renderHookWithStoreProvider(
            () =>
                useStakingPendingTransaction({
                    accountKey,
                    pendingTransaction: routeTransaction,
                    stakeType,
                }),
            { services: { store } },
        )),
        updateTransaction,
    };
};

const homeRoutes = [
    { name: RootStackRoutes.AppTabs, params: { screen: AppTabsRoutes.EarnStack } },
    { name: RootStackRoutes.StakingManagement, params: { accountKey } },
];

describe('useStakingPendingTransaction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getDefaultStore().set(alertAtom, null);
        jest.useFakeTimers();
        jest.setSystemTime(pendingTransaction.submittedAt);
        mockIsFocused = true;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('is idle without a pushed transaction', async () => {
        const { result } = await renderPendingTransaction();
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(fetchAccount).not.toHaveBeenCalled();
        expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    });

    it.each([
        ['is not in the store yet', null],
        ['is still unconfirmed', { txid: '0xabc', blockHeight: 0, type: 'sent' }],
    ] as const)(
        'polls the account and exposes the sheet while the transaction %s',
        async (_, transaction) => {
            const { result } = await renderPendingTransaction({ pendingTransaction, transaction });

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

            expect(fetchAccount).toHaveBeenCalledTimes(2);
            expect(fetchAccount).toHaveBeenCalledWith({ accountKey });
            expect(mockNavigation.dispatch).not.toHaveBeenCalled();
        },
    );

    it('unlocks the form and says so when the transaction is still missing after the grace period', async () => {
        const { result } = await renderPendingTransaction({ pendingTransaction });

        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS - 1));

        expect(result.current.isPending).toBe(true);
        expect(getAlert()).toBeNull();

        await act(() => jest.advanceTimersByTime(1));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(getAlert()?.type).toBe('earnTransactionNotConfirmed');

        fetchAccount.mockClear();
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(fetchAccount).toHaveBeenCalledWith({ accountKey });
        expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    });

    it.each([undefined, 'deviceError'] as const)(
        'keeps the deferred warning when an older alert finishes closing (type: %s)',
        async type => {
            const oldAlert: Alert = { type, primaryButtonTitle: 'Close old alert' };
            getDefaultStore().set(showAlertAtom, oldAlert);
            await renderPendingTransaction({ pendingTransaction });
            await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));
            await act(() => getDefaultStore().set(hideAlertAtom, oldAlert));
            const warning = getDefaultStore().get(alertAtom);
            expect(warning?.type).toBe('earnTransactionNotConfirmed');

            await act(() => getDefaultStore().set(hideAlertAtom, oldAlert));

            expect(getDefaultStore().get(alertAtom)).toBe(warning);
        },
    );

    it('leaves a replacement alert open when the staking flow unmounts', async () => {
        const { unmount } = await renderPendingTransaction({ pendingTransaction });
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));
        const otherAlert: Alert = { type: 'deviceError', primaryButtonTitle: 'Close device error' };
        await act(() => getDefaultStore().set(showAlertAtom, otherAlert));
        await unmount();

        expect(getDefaultStore().get(alertAtom)).toBe(otherAlert);
    });

    it('keeps a new review open when a missing transaction confirms in the background', async () => {
        const { rerender, updateTransaction } = await renderPendingTransaction({
            pendingTransaction,
        });
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));

        mockIsFocused = false;
        await rerender({});
        await act(() => updateTransaction({ txid: '0xabc', blockHeight: 100, type: 'sent' }));

        expect(mockNavigation.dispatch).not.toHaveBeenCalled();

        mockIsFocused = true;
        await rerender({});
        expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
    });

    it('keeps the old pending sheet closed while another review is focused', async () => {
        const { rerender, updateTransaction } = await renderPendingTransaction({
            pendingTransaction,
        });
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));
        mockIsFocused = false;
        await rerender({});
        await act(() => updateTransaction({ txid: '0xabc', blockHeight: 0, type: 'sent' }));
        expect(mockPendingSheet).toHaveBeenLastCalledWith(
            expect.objectContaining({ isPending: false }),
        );
    });

    it.each([true, false])(
        'warns when the transaction disappears again only if the warning was not acknowledged (%s)',
        async didAcknowledge => {
            const { result, updateTransaction } = await renderPendingTransaction({
                pendingTransaction,
            });
            await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));

            if (didAcknowledge) {
                await act(() => {
                    getAlert()?.onPressPrimaryButton?.();
                    getDefaultStore().set(hideAlertAtom, 'earnTransactionNotConfirmed');
                });
                expect(getAlert()).toBeNull();
            }

            await act(() => updateTransaction({ txid: '0xabc', blockHeight: 0, type: 'sent' }));
            expect(result.current.isPending).toBe(true);
            expect(getAlert()).toBeNull();

            await act(() => updateTransaction(null));

            expect(result.current.isPending).toBe(false);
            expect(getAlert()?.type).toBe(
                didAcknowledge ? undefined : 'earnTransactionNotConfirmed',
            );
        },
    );

    it.each([undefined, 1000])(
        'keeps a pending account entry locked past the grace period (deadline: %s)',
        async deadline => {
            const { result } = await renderPendingTransaction({
                pendingTransaction,
                transaction: { txid: '0xabc', blockHeight: 0, type: 'sent', deadline },
            });

            await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS * 2));

            expect(result.current.isPending).toBe(true);
            expect(getAlert()).toBeNull();
        },
    );

    it('resets to the complete screen once the transaction confirms', async () => {
        const { result } = await renderPendingTransaction({
            pendingTransaction,
            stakeType: 'unstake',
            transaction: { txid: '0xabc', blockHeight: 100, type: 'sent' },
        });
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(fetchAccount).not.toHaveBeenCalled();
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
