import { getDefaultStore } from 'jotai';

import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import {
    type Alert,
    type AlertType,
    alertAtom,
    hideAlertAtom,
    showAlertAtom,
} from '@suite-native/alerts';
import {
    AppTabsRoutes,
    RootStackRoutes,
    type StakingPendingTxParams,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useStakingPendingTransaction } from './useStakingPendingTransaction';
import { type EarnFormDraftPrefix } from '../../types';

type MockTransaction = Pick<WalletAccountTransaction, 'txid' | 'blockHeight' | 'type' | 'deadline'>;

const mockDispatch = jest.fn();
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
const mockNavigation = { dispatch: jest.fn() };
const mockOpenInBlockchain = jest.fn();
const mockPendingSheet = jest.fn();
const mockBottomSheetRef = { current: null };
const mockFeeInfo = { blockTime: 12 };
let mockTransaction: MockTransaction | null = null;
let mockIsFocused = true;

jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ dispatch: mockDispatch }),
}));
jest.mock('@suite-native/alerts', () => ({
    ...jest.requireActual('@suite-native/alerts'),
    useAlert: () => ({ showAlert: mockShowAlert, hideAlert: mockHideAlert }),
}));
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useIsFocused: () => mockIsFocused,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: (payload: unknown) => ({ type: 'test/fetch-account', payload }),
    selectAccountNetworkSymbol: () => 'eth',
    selectConvertedNetworkFeeInfo: () => mockFeeInfo,
    selectTransactionByAccountKeyAndTxid: () => mockTransaction,
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

const accountKey = mockAccountKey({ descriptor: 'testAccountKey' });
const pendingTransaction: StakingPendingTxParams = {
    amountInBaseUnits: '1000000000000000000',
    fee: '21000',
    submittedAt: 1_700_000_000_000,
    txid: '0xabc',
};
const POLL_INTERVAL_MS = 6_000;
const MISSING_TRANSACTION_GRACE_MS = 120_000;

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
        getDefaultStore().set(alertAtom, null);
        mockShowAlert.mockImplementation((alert: Alert) =>
            getDefaultStore().set(showAlertAtom, alert),
        );
        mockHideAlert.mockImplementation((type?: AlertType) =>
            getDefaultStore().set(hideAlertAtom, type),
        );
        jest.useFakeTimers();
        jest.setSystemTime(pendingTransaction.submittedAt);
        mockTransaction = null;
        mockIsFocused = true;
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

    it('unlocks the form and says so when the transaction is still missing after the grace period', async () => {
        const { result } = await renderPendingTransaction(pendingTransaction);

        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS - 1));

        expect(result.current.isPending).toBe(true);
        expect(mockShowAlert).not.toHaveBeenCalled();

        await act(() => jest.advanceTimersByTime(1));

        expect(result.current).toEqual({ isPending: false, pendingModal: null });
        expect(mockShowAlert).toHaveBeenCalledTimes(1);

        mockDispatch.mockClear();
        await act(() => jest.advanceTimersByTime(POLL_INTERVAL_MS));

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'test/fetch-account',
            payload: { accountKey },
        });
        expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    });

    it('waits for an unrelated alert before showing the missing transaction warning', async () => {
        const otherAlert: Alert = {
            type: 'deviceError',
            primaryButtonTitle: 'Close device error',
            onPressPrimaryButton: jest.fn(),
        };
        getDefaultStore().set(showAlertAtom, otherAlert);
        await renderPendingTransaction(pendingTransaction);
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));

        expect(getDefaultStore().get(alertAtom)).toBe(otherAlert);
        expect(mockShowAlert).not.toHaveBeenCalled();

        await act(() => getDefaultStore().set(hideAlertAtom, 'deviceError'));

        expect(getDefaultStore().get(alertAtom)?.type).toBe('stakingTransactionNotConfirmed');
        expect(mockShowAlert).toHaveBeenCalledTimes(1);
    });

    it('leaves a replacement alert open when the staking flow unmounts', async () => {
        const { unmount } = await renderPendingTransaction(pendingTransaction);
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));
        const otherAlert: Alert = { type: 'deviceError', primaryButtonTitle: 'Close device error' };
        await act(() => getDefaultStore().set(showAlertAtom, otherAlert));
        await unmount();

        expect(getDefaultStore().get(alertAtom)).toBe(otherAlert);
    });

    it('takes the alert down when the missing transaction confirms after all', async () => {
        const { rerender } = await renderPendingTransaction(pendingTransaction);
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockHideAlert).not.toHaveBeenCalled();

        mockTransaction = { txid: '0xabc', blockHeight: 100, type: 'sent' };
        await rerender({});

        expect(mockHideAlert).toHaveBeenCalledTimes(1);
        expect(mockHideAlert).toHaveBeenCalledWith('stakingTransactionNotConfirmed');
        expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
    });

    it('keeps a new review open when a missing transaction confirms in the background', async () => {
        const { rerender } = await renderPendingTransaction(pendingTransaction);
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));

        mockIsFocused = false;
        await rerender({});
        mockTransaction = { txid: '0xabc', blockHeight: 100, type: 'sent' };
        await rerender({});

        expect(mockNavigation.dispatch).not.toHaveBeenCalled();

        mockIsFocused = true;
        await rerender({});
        expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
    });

    it('keeps the old pending sheet closed while another review is focused', async () => {
        const { rerender } = await renderPendingTransaction(pendingTransaction);
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));
        mockIsFocused = false;
        mockTransaction = { txid: '0xabc', blockHeight: 0, type: 'sent' };
        await rerender({});
        expect(mockPendingSheet).toHaveBeenLastCalledWith(
            expect.objectContaining({ isPending: false }),
        );
    });

    it('does not repeat a dismissed alert when the same transaction disappears again', async () => {
        const { result, rerender } = await renderPendingTransaction(pendingTransaction);
        await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS));

        await act(() => mockShowAlert.mock.calls[0][0].onPressPrimaryButton());

        mockTransaction = { txid: '0xabc', blockHeight: 0, type: 'sent' };
        await rerender({});
        expect(result.current.isPending).toBe(true);

        mockTransaction = null;
        await rerender({});

        expect(result.current.isPending).toBe(false);
        expect(mockShowAlert).toHaveBeenCalledTimes(1);
    });

    it.each([undefined, 1000])(
        'keeps a pending account entry locked past the grace period (deadline: %s)',
        async deadline => {
            mockTransaction = { txid: '0xabc', blockHeight: 0, type: 'sent', deadline };
            const { result } = await renderPendingTransaction(pendingTransaction);

            await act(() => jest.advanceTimersByTime(MISSING_TRANSACTION_GRACE_MS * 2));

            expect(result.current.isPending).toBe(true);
            expect(mockShowAlert).not.toHaveBeenCalled();
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
