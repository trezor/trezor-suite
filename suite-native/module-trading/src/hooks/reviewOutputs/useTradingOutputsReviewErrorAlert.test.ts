import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, act } from '@suite-native/test-utils-store';

import { useTradingOutputsReviewErrorAlert } from './useTradingOutputsReviewErrorAlert';
import {
    createTradingLightStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const mockShowAlert = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('useTradingOutputsReviewErrorAlert', () => {
    let store: TestStore;

    const renderUseTradingOutputsReviewErrorAlert = async (accountKey: AccountKey) =>
        await renderHookWithTradingProvider(() => useTradingOutputsReviewErrorAlert(accountKey), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingLightStore({ tradeType: 'exchange' });
    });

    it('should show alert', async () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = await renderUseTradingOutputsReviewErrorAlert(
            mockAccountKey({ symbol: 'btc', descriptor: 'btc1normal' }),
        );

        await act(() => {
            result.current(mockOnRetry, mockOnCancel);
        });

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith({
            icon: 'warningCircle',
            title: getTranslation('moduleSend.review.outputs.errorAlert.generic.title'),
            description: getTranslation('moduleSend.review.outputs.errorAlert.generic.description'),
            primaryButtonTitle: getTranslation('generic.buttons.tryAgain'),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: mockOnRetry,
            secondaryButtonTitle: getTranslation('generic.buttons.cancel'),
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressSecondaryButton: mockOnCancel,
        });
    });

    it('should show special text fort solana', async () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = await renderUseTradingOutputsReviewErrorAlert(
            mockAccountKey({
                symbol: 'sol',
                descriptor: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
            }),
        );

        await act(() => {
            result.current(mockOnRetry, mockOnCancel);
        });

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                title: getTranslation('moduleSend.review.outputs.errorAlert.solana.title'),
                description: getTranslation(
                    'moduleSend.review.outputs.errorAlert.solana.description',
                ),
            }),
        );
    });
});
