import { type Store } from '@reduxjs/toolkit';

import { type DeviceRootState } from '@suite-common/device';
import { type TradingError } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
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

    const renderUseTradingOutputsReviewErrorAlert = () =>
        renderHookWithTradingProvider(() => useTradingOutputsReviewErrorAlert(), {
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
            result.current(
                { type: 'sign-tx-error', code: 'cannot-send-transaction' },
                mockOnRetry,
                mockOnCancel,
            );
        });

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith({
            icon: 'warningCircle',
            title: getTranslation('moduleTrading.tradingReviewOutputs.errorAlert.title'),
            description: getTranslation(
                'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
            ),
            primaryButtonTitle: getTranslation('generic.buttons.tryAgain'),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: mockOnRetry,
            secondaryButtonTitle: getTranslation('generic.buttons.cancel'),
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressSecondaryButton: mockOnCancel,
        });
    });

    it.each<[TradingError, TxKeyPath]>([
        [
            { type: 'error', code: 'refresh-transaction-failed' },
            'moduleTrading.tradingReviewOutputs.errorAlert.quoteExpiredDescription',
        ],
        [
            {
                type: 'error',
                code: 'invalid-response',
                cause: { source: 'invity', message: 'Bad gateway' },
            },
            'moduleTrading.tradingReviewOutputs.errorAlert.providerNoResponseDescription',
        ],
        [
            { type: 'sign-tx-error', code: 'device-not-connected' },
            'moduleTrading.tradingReviewOutputs.errorAlert.deviceNotConnectedDescription',
        ],
        [
            {
                type: 'sign-tx-error',
                code: 'push-transaction-failed',
                cause: {
                    source: 'send-form',
                    error: { error: 'push-transaction-failed', message: 'Backend error' },
                },
            },
            'moduleTrading.tradingReviewOutputs.errorAlert.pushTransactionDescription',
        ],
    ])('should describe %o without its cause message', async (tradingError, descriptionId) => {
        const { result } = await renderUseTradingOutputsReviewErrorAlert();

        await act(() => {
            result.current(tradingError, jest.fn(), jest.fn());
        });

        expect(mockShowAlert).toHaveBeenCalledWith(
            expect.objectContaining({ description: getTranslation(descriptionId) }),
        );
    });
});
