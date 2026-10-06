import { type Store } from '@reduxjs/toolkit';

import { type DeviceRootState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';
import { type TradingRootState } from '@suite-native/trading-state';

import { useTradingOutputsReviewErrorAlert } from './useTradingOutputsReviewErrorAlert';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState & DeviceRootState;

const mockShowAlert = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('useTradingOutputsReviewErrorAlert', () => {
    let store: Store<State>;

    const renderUseTradingOutputsReviewErrorAlert = async () =>
        await renderHookWithTradingProvider(() => useTradingOutputsReviewErrorAlert(), {
            services: { store },
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingTestStore({ tradeType: 'exchange' });
    });

    it('should show alert', async () => {
        const mockOnRetry = jest.fn();
        const mockOnCancel = jest.fn();
        const { result } = await renderUseTradingOutputsReviewErrorAlert();

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
});
