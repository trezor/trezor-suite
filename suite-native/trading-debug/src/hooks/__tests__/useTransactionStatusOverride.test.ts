import { act } from 'react';

import type { TransactionStatus } from '@suite-common/trading';
import { renderHook } from '@suite-native/test-utils';

import { useTransactionStatusOverride } from '../useTransactionStatusOverride';

let mockIsDebugMode: boolean;

jest.mock('../useTradingDebugModeFlag', () => ({
    useTradingDebugModeFlag: () => mockIsDebugMode,
}));

const noStatus: TransactionStatus = { isPending: false, isConfirmed: false, isFailed: false };
const pendingStatus: TransactionStatus = { isPending: true, isConfirmed: false, isFailed: false };

describe('useTransactionStatusOverride', () => {
    describe('when debug mode is disabled', () => {
        beforeEach(() => {
            mockIsDebugMode = false;
        });

        it('returns the original status unchanged', () => {
            const { result } = renderHook(() => useTransactionStatusOverride(pendingStatus));

            expect(result.current.status).toEqual(pendingStatus);
        });

        it('forceStatus is a noop that does not change the output', () => {
            const { result } = renderHook(() => useTransactionStatusOverride(noStatus));

            act(() => {
                result.current.forceStatus('isPending');
            });

            expect(result.current.status).toEqual(noStatus);
        });
    });

    describe('when debug mode is enabled', () => {
        beforeEach(() => {
            mockIsDebugMode = true;
        });

        it('returns the original status when no override is set', () => {
            const { result } = renderHook(() => useTransactionStatusOverride(pendingStatus));

            expect(result.current.status).toEqual(pendingStatus);
        });

        it('returns the real forceStatus setter so an override can be selected', () => {
            const { result } = renderHook(() => useTransactionStatusOverride(noStatus));

            act(() => {
                result.current.forceStatus('isPending');
            });

            expect(result.current.status).toEqual({
                isPending: true,
                isConfirmed: false,
                isFailed: false,
            });
        });

        it.each([
            ['isPending', { isPending: true, isConfirmed: false, isFailed: false }],
            ['isFailed', { isPending: false, isConfirmed: false, isFailed: true }],
            ['isConfirmed', { isPending: false, isConfirmed: true, isFailed: false }],
            ['none', { isPending: false, isConfirmed: false, isFailed: false }],
        ] as const)('forces status to %s', (override, expectedStatus) => {
            const { result } = renderHook(() => useTransactionStatusOverride(noStatus));

            act(() => {
                result.current.forceStatus(override);
            });

            expect(result.current.status).toEqual(expectedStatus);
        });

        it('resets to original status after forceStatus is called with no-override', () => {
            const { result } = renderHook(() => useTransactionStatusOverride(pendingStatus));

            act(() => {
                result.current.forceStatus('isFailed');
            });
            act(() => {
                result.current.forceStatus('no-override');
            });

            expect(result.current.status).toEqual(pendingStatus);
        });
    });
});
