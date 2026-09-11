import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeSendAmountErrorBadge } from './ExchangeSendAmountErrorBadge';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('ExchangeSendAmountErrorBadge', () => {
    let form: ExchangeFormType;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
        },
    };

    const renderExchangeSendAmountErrorBadge = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(<ExchangeSendAmountErrorBadge />, {
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        form = result.current;
    });

    it('should display nothing when field has no error', async () => {
        const { toJSON } = await renderExchangeSendAmountErrorBadge();

        expect(toJSON()).toBeNull();
    });

    it('should display error message when field has error', async () => {
        await act(() => {
            form.setError('sendCryptoAmount', {
                type: 'manual',
                message: 'VALIDATION_ERROR',
            });
            form.setValue('sendCryptoAmount', '1000');
        });

        const { getByText } = await renderExchangeSendAmountErrorBadge();

        expect(getByText('VALIDATION_ERROR')).toBeOnTheScreen();
    });

    it('should display nothing when field has error but quotes are loading', async () => {
        await act(() => {
            form.setError('sendCryptoAmount', {
                type: 'manual',
                message: 'VALIDATION_ERROR',
            });
            form.setValue('sendCryptoAmount', '1000');
        });

        const { toJSON } = await renderExchangeSendAmountErrorBadge({
            wallet: { trading: { exchange: { isLoading: true } } },
        });

        expect(toJSON()).toBeNull();
    });
});
