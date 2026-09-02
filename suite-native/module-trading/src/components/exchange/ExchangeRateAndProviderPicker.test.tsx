import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, userEvent } from '@suite-native/test-utils-store';
import { exchangeQuotes, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { getIndexOrThrow } from '@trezor/utils';

import { ExchangeRateAndProviderPicker } from './ExchangeRateAndProviderPicker';
import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('ExchangeRateAndProviderPicker', () => {
    let exchangeForm: ExchangeFormType;
    let unmount: (() => void) | undefined;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    };

    const renderExchangeRateAndProviderPicker = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const result = await renderWithTradingProvider(<ExchangeRateAndProviderPicker />, {
            services,
            tradeType: 'exchange',
            overrides: { ...baseOverrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

        ({ unmount } = result);

        return result;
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const { result } = await renderHookWithTradingProvider(() => useExchangeForm(), {
            services,
            tradeType: 'exchange',
            overrides: baseOverrides,
        });
        exchangeForm = result.current;
    });

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    it('should render nothing when no quote is selected and quotes are not loading', async () => {
        const { toJSON } = await renderExchangeRateAndProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render provider picker when no quote is selected and quotes are loading', async () => {
        const { getByText } = await renderExchangeRateAndProviderPicker({
            wallet: { trading: { exchange: { isLoading: true } } },
        });

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', async () => {
        await act(() => {
            exchangeForm.setValue('quote', mercuryoFixedWorstQuote);
        });

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    describe('analytics', () => {
        const withQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { trading: { exchange: { quotes: exchangeQuotes } } },
        };

        beforeEach(async () => {
            await act(() => {
                exchangeForm.setValue('quote', mercuryoFixedWorstQuote);
            });
            reportMock.mockClear();
        });

        it('should fire analytics event on provider select', async () => {
            const { getByText } = await renderExchangeRateAndProviderPicker(withQuotes);

            await userEvent.press(
                getByText(getTranslation('moduleTrading.tradingScreen.provider')),
            );
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
            const { getByText, getAllByText } =
                await renderExchangeRateAndProviderPicker(withQuotes);

            await userEvent.press(
                getByText(getTranslation('moduleTrading.tradingScreen.provider')),
            );
            await userEvent.press(getIndexOrThrow(getAllByText('Mercuryo'), 1));

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
