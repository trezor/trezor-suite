import { renderHook } from '@testing-library/react';

import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldPendingTransactionState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';

const mockReport = jest.fn();
const mockDispatch = jest.fn();
const mockGetPendingTransaction = jest.fn<YieldPendingTransactionState | null, []>();
const mockGetPendingTxStatus = jest.fn<string | null, []>();

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
}));

jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('@suite-common/dependency-injection', () => {
    const analytics = { report: (...args: unknown[]) => mockReport(...args) };

    return { useServices: () => ({ analytics }) };
});

jest.mock('@suite/analytics', () => ({ selectDesktopAnalyticsDep: () => ({}) }));

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

const renderTracking = () =>
    renderHook(() =>
        useYieldPendingTransactionTracking({ account, flowType: 'deposit', flowKey: 'flow-1' }),
    );

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
});
