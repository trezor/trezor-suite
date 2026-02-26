import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, screen, userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';

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

    const renderExchangeForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeRateAndProviderPicker = () =>
        renderWithStoreProviderAsync(<ExchangeRateAndProviderPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(async () => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const { result } = await renderExchangeForm();
        exchangeForm = result.current;

        preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quote is selected and quotes are not loading', async () => {
        const { toJSON } = await renderExchangeRateAndProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render provider picker when no quote is selected and quotes are loading', async () => {
        preloadedState!.wallet!.trading!.exchange!.isLoading = true;

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', async () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = await renderExchangeRateAndProviderPicker();

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
            const { getByText } = await renderExchangeRateAndProviderPicker();

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
            const { getByText, getAllByText } = await renderExchangeRateAndProviderPicker();

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
