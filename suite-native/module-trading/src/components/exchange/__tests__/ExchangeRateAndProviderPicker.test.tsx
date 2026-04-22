import { events } from '@suite-native/analytics';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, userEvent } from '@suite-native/test-utils-store';
import { exchangeQuotes, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeRateAndProviderPicker } from '../ExchangeRateAndProviderPicker';

const reportMock = jest.fn();

describe('ExchangeRateAndProviderPicker', () => {
    let exchangeForm: ExchangeFormType;
    let unmount: (() => void) | undefined;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    };

    const renderExchangeRateAndProviderPicker = (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const result = renderWithTradingProvider(<ExchangeRateAndProviderPicker />, {
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        exchangeForm = result.current;
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render nothing when no quote is selected and quotes are not loading', () => {
        const { toJSON } = renderExchangeRateAndProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render provider picker when no quote is selected and quotes are loading', () => {
        const { getByText } = renderExchangeRateAndProviderPicker({
            wallet: { trading: { exchange: { isLoading: true } } },
        });

        expect(getByText('Provider')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', () => {
        act(() => {
            exchangeForm.setValue('quote', mercuryoFixedWorstQuote);
        });

        const { getByText } = renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    describe('analytics', () => {
        const withQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { trading: { exchange: { quotes: exchangeQuotes } } },
        };

        beforeEach(() => {
            act(() => {
                exchangeForm.setValue('quote', mercuryoFixedWorstQuote);
            });
            reportMock.mockClear();
        });

        it('should fire analytics event on provider select', async () => {
            const { getByText } = renderExchangeRateAndProviderPicker(withQuotes);

            await userEvent.press(getByText('Provider'));
            await userEvent.press(getByText('Cexdirect'));

            expect(reportMock).toHaveBeenCalledTimes(2);
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingCompareOffersEvent.name,
                payload: {
                    type: 'exchange',
                },
            });
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'exchange',
                    parameter: 'provider',
                },
            });
        });

        it('should not fire analytics event when same provider is selected', async () => {
            const { getByText, getAllByText } = renderExchangeRateAndProviderPicker(withQuotes);

            await userEvent.press(getByText('Provider'));
            await userEvent.press(getAllByText('Mercuryo')[1]);

            expect(reportMock).toHaveBeenCalledTimes(1);
            expect(reportMock).not.toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'exchange',
                    parameter: 'provider',
                },
            });
        });
    });
});
