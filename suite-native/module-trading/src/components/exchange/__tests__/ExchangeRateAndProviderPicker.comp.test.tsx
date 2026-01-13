import { EventType, analytics } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    screen,
    userEvent,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeRateAndProviderPicker } from '../ExchangeRateAndProviderPicker';

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

    it('should render provider and rate pickers when no quote is selected and quotes are loading', async () => {
        preloadedState!.wallet!.trading!.exchange!.isLoading = true;

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Rate')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', async () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render rate when quote is selected', async () => {
        act(() => {
            exchangeForm.setValue('quote', exchangeQuotes[0]);
        });

        const { getByText } = await renderExchangeRateAndProviderPicker();

        expect(getByText('Rate')).toBeOnTheScreen();
        expect(getByText('Fixed')).toBeOnTheScreen();
    });

    describe('analytics', () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');

        beforeEach(() => {
            preloadedState!.wallet!.trading!.exchange!.quotes = exchangeQuotes;
            act(() => {
                exchangeForm.setValue('quote', exchangeQuotes[0]);
            });
            analyticsSpy.mockClear();
        });

        afterAll(() => {
            analyticsSpy.mockRestore();
        });

        it('should fire analytics event on provider select', async () => {
            const { getByText } = await renderExchangeRateAndProviderPicker();

            await userEvent.press(getByText('Provider'));
            await userEvent.press(getByText('Cexdirect'));

            expect(analyticsSpy).toHaveBeenCalledTimes(2);
            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingCompareOffers,
                payload: {
                    type: 'exchange',
                },
            });
            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingParameterChanged,
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

            expect(analyticsSpy).toHaveBeenCalledTimes(1);
            expect(analyticsSpy).not.toHaveBeenCalledWith({
                type: EventType.TradingParameterChanged,
                payload: {
                    type: 'exchange',
                    parameter: 'provider',
                },
            });
        });
    });
});
