import { AccountKey } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils';
import { type TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';

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
        renderHookWithStoreProviderAsync(() => useTradingOutputsReviewErrorAlert(accountKey), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = initStore({ wallet: getWalletState({ tradeType: 'exchange' }) }).store;
    });

    it('should show alert', async () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = await renderUseTradingOutputsReviewErrorAlert(
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
            primaryButtonVariant: 'redBold',
            onPressPrimaryButton: mockOnRetry,
            secondaryButtonTitle: 'Cancel',
            secondaryButtonVariant: 'redElevation0',
            onPressSecondaryButton: mockOnCancel,
        });
    });

    it('should show special text fort solana', async () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = await renderUseTradingOutputsReviewErrorAlert(
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
