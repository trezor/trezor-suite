import { type AccountKey } from '@suite-common/wallet-types';
import { type TestStore, act } from '@suite-native/test-utils-store';

import {
    createTradingLightStore,
    renderHookWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useTradingOutputsReviewErrorAlert } from '../useTradingOutputsReviewErrorAlert';

const mockShowAlert = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('useTradingOutputsReviewErrorAlert', () => {
    let store: TestStore;

    const renderUseTradingOutputsReviewErrorAlert = (accountKey: AccountKey) =>
        renderHookWithTradingProvider(() => useTradingOutputsReviewErrorAlert(accountKey), {
            store,
            providers: ['intl'],
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingLightStore({ tradeType: 'exchange' });
    });

    it('should show alert', () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = renderUseTradingOutputsReviewErrorAlert(
            'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        act(() => {
            result.current(mockOnRetry, mockOnCancel);
        });

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith({
            icon: 'warningCircle',
            title: 'Transaction failed',
            description:
                'There has been an unexpected error, please try sending your transaction again.',
            primaryButtonTitle: 'Try again',
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: mockOnRetry,
            secondaryButtonTitle: 'Cancel',
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressSecondaryButton: mockOnCancel,
        });
    });

    it('should show special text fort solana', () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = renderUseTradingOutputsReviewErrorAlert(
            'sol-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        act(() => {
            result.current(mockOnRetry, mockOnCancel);
        });

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Transaction failed due to timeout',
                description: 'Make sure you send the transaction within 1 minute from signing.',
            }),
        );
    });
});
