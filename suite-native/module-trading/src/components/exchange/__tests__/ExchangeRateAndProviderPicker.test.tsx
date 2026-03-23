import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeRateAndProviderPicker } from '../ExchangeRateAndProviderPicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('ExchangeRateAndProviderPicker', () => {
    let exchangeForm: ExchangeFormType;
    let preloadedState: PreloadedState;

    const renderExchangeForm = () => renderHookWithStoreProvider(() => useExchangeForm());

    const renderExchangeRateAndProviderPicker = () =>
        renderWithStoreProvider(<ExchangeRateAndProviderPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const { result } = renderExchangeForm();
        exchangeForm = result.current;

        preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quote is selected and quotes are not loading', () => {
        const { toJSON } = renderExchangeRateAndProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render provider picker when no quote is selected and quotes are loading', () => {
        preloadedState!.wallet!.trading!.exchange!.isLoading = true;

        const { getByText } = renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    describe('analytics', () => {
        beforeEach(() => {
            preloadedState!.wallet!.trading!.exchange!.quotes = exchangeQuotes;
            act(() => {
                exchangeForm.setValue('quote', exchangeQuotes[0]);
            });
            reportMock.mockClear();
        });

        it('should fire analytics event on provider select', async () => {
            const { getByText } = renderExchangeRateAndProviderPicker();

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
            const { getByText, getAllByText } = renderExchangeRateAndProviderPicker();

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
