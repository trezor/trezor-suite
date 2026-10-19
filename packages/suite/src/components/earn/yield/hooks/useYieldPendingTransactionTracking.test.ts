import { act } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { events } from '@suite-common/analytics';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldPendingTransactionState, yieldActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';

import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';

const mockReport = jest.fn();
const mockGetPendingTransaction = jest.fn<YieldPendingTransactionState | null, []>();
const mockGetPendingTxStatus = jest.fn<string | null, []>();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectYieldSession: () => ({
        action: { pendingTransaction: mockGetPendingTransaction() },
    }),
    useYieldPendingTxStatus: () => mockGetPendingTxStatus(),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') }) as Account;

const SUBMITTED_AGO_MS = 60_000;

const pendingDeposit = (): YieldPendingTransactionState => ({
    type: 'deposit',
    txid: '0xdeposit',
    amount: '100',
    fee: '31500000000',
    submittedAt: Date.now() - SUBMITTED_AGO_MS,
});

type TrackingOptions = Partial<Parameters<typeof useYieldPendingTransactionTracking>[0]>;

const renderTracking = (options: TrackingOptions = {}) => {
    const { services } = createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, AppState>({
        preloadedState: {},
        services: () => ({ analytics: mockDesktopAnalytics(mockReport) }),
    });

    const remount = () =>
        renderHookWithStoreProvider(
            () =>
                useYieldPendingTransactionTracking({
                    account,
                    flowType: 'deposit',
                    flowKey: 'flow-1',
                    ...options,
                }),
            { services },
        );

    const view = remount();

    return { ...view, store: services.store, remount };
};

const getReportedDurationMs = (type: string) =>
    mockReport.mock.calls.find(
        ([event]) => event.type === events.yieldDepositEvent.name && event.payload.type === type,
    )?.[0].payload.durationMs;

describe('useYieldPendingTransactionTracking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('measures durationMs from the stored submittedAt, not from the mount time', () => {
        // The tx resolves right on mount — the mount-scoped ref would measure ~0 ms here, only the
        // stored submittedAt gives the real time since broadcast (it survives leaving the page).
        mockGetPendingTransaction.mockReturnValue(pendingDeposit());
        mockGetPendingTxStatus.mockReturnValue('confirmed');

        renderTracking();

        const durationMs = getReportedDurationMs('success');
        expect(durationMs).toBeGreaterThanOrEqual(SUBMITTED_AGO_MS);
        expect(durationMs).toBeLessThan(SUBMITTED_AGO_MS + 10_000);
    });

    it('measures the leftPending durationMs from the stored submittedAt on unmount', () => {
        mockGetPendingTransaction.mockReturnValue(pendingDeposit());
        mockGetPendingTxStatus.mockReturnValue('pending');

        const { unmount } = renderTracking();
        unmount();

        const durationMs = getReportedDurationMs('leftPending');
        expect(durationMs).toBeGreaterThanOrEqual(SUBMITTED_AGO_MS);
        expect(durationMs).toBeLessThan(SUBMITTED_AGO_MS + 10_000);
    });

    it('reports claim success once while Merkl is still catching up', () => {
        const claim = { ...pendingDeposit(), type: 'claim' as const };
        mockGetPendingTransaction.mockReturnValue(claim);
        mockGetPendingTxStatus.mockReturnValue('confirmed');
        const waitForMerklToResolveClaim = () => new Promise(() => {});

        const { rerender } = renderTracking({ flowType: 'claim', waitForMerklToResolveClaim });
        mockGetPendingTransaction.mockReturnValue({ ...claim });
        rerender();

        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(mockReport).toHaveBeenCalledWith({
            type: events.yieldClaimEvent.name,
            payload: {
                action: 'continue',
                type: 'success',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
            },
        });
    });

    it('completes a confirmed claim when Merkl refresh fails without reporting another success', async () => {
        mockGetPendingTransaction.mockReturnValue({ ...pendingDeposit(), type: 'claim' });
        mockGetPendingTxStatus.mockReturnValue('confirmed');
        const waitForMerklToResolveClaim = () => Promise.reject(new Error('Merkl unavailable'));
        const { store } = renderTracking({ flowType: 'claim', waitForMerklToResolveClaim });

        await act(async () => {
            await Promise.resolve();
        });

        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(store.getActions().filter(yieldActions.completeAction.match)).toHaveLength(1);
    });

    it('does not complete a newer claim when an older Merkl refresh finishes', async () => {
        const firstClaim = { ...pendingDeposit(), type: 'claim' as const, txid: 'first-claim' };
        mockGetPendingTransaction.mockReturnValue(firstClaim);
        mockGetPendingTxStatus.mockReturnValue('confirmed');
        let resolveMerkl: () => void = () => {};
        const merklPromise = new Promise<void>(resolve => {
            resolveMerkl = resolve;
        });
        const { rerender, store } = renderTracking({
            flowType: 'claim',
            waitForMerklToResolveClaim: () => merklPromise,
        });
        mockGetPendingTransaction.mockReturnValue({ ...firstClaim, txid: 'new-claim' });
        mockGetPendingTxStatus.mockReturnValue('pending');
        rerender();

        await act(async () => {
            resolveMerkl();
            await merklPromise;
        });

        expect(mockReport).toHaveBeenCalledTimes(1);
        expect(store.getActions().filter(yieldActions.completeAction.match)).toHaveLength(0);
    });
});

it('does not repeat claim success when reopening the same flow while Merkl is still catching up', () => {
    mockReport.mockClear();
    mockGetPendingTransaction.mockReturnValue({
        ...pendingDeposit(),
        type: 'claim',
        txid: 'reopened-claim',
    });
    mockGetPendingTxStatus.mockReturnValue('confirmed');
    const { unmount, remount } = renderTracking({
        flowType: 'claim',
        waitForMerklToResolveClaim: () => new Promise(() => {}),
    });
    unmount();
    const reopened = remount();
    expect(mockReport).toHaveBeenCalledTimes(1);
    reopened.unmount();
});

it('does not let a Merkl refresh from an unmounted page complete a newer claim', async () => {
    mockReport.mockClear();
    const first = { ...pendingDeposit(), type: 'claim' as const, txid: 'unmounted-claim' };
    mockGetPendingTransaction.mockReturnValue(first);
    mockGetPendingTxStatus.mockReturnValue('confirmed');
    let resolveMerkl: () => void = () => {};
    const merkl = new Promise<void>(resolve => {
        resolveMerkl = resolve;
    });
    const { unmount, store } = renderTracking({
        flowType: 'claim',
        waitForMerklToResolveClaim: () => merkl,
    });
    unmount();
    mockGetPendingTransaction.mockReturnValue({ ...first, txid: 'newer-claim' });
    await act(async () => {
        resolveMerkl();
        await merkl;
    });
    expect(store.getActions().filter(yieldActions.completeAction.match)).toHaveLength(0);
});

it('lets a reopened claim finish independently of the old page analytics deduplication', async () => {
    mockReport.mockClear();
    mockGetPendingTransaction.mockReturnValue({
        ...pendingDeposit(),
        type: 'claim',
        txid: 'reopened-completion-claim',
    });
    mockGetPendingTxStatus.mockReturnValue('confirmed');
    const waitForMerklToResolveClaim = jest
        .fn()
        .mockImplementationOnce(() => new Promise(() => {}))
        .mockResolvedValue(undefined);
    const { unmount, remount, store } = renderTracking({
        flowType: 'claim',
        waitForMerklToResolveClaim,
    });
    unmount();
    const reopened = remount();
    await act(async () => {
        await Promise.resolve();
    });

    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(store.getActions().filter(yieldActions.completeAction.match)).toHaveLength(1);
    reopened.unmount();
});
