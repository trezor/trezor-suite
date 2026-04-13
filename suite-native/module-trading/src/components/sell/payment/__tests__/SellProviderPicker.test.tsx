import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import {
    banxaCreditCardSellQuote,
    getWalletState,
    sellQuotes,
} from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellProviderPicker } from '../SellProviderPicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('SellProviderPicker', () => {
    let form: SellFormType;
    let preloadedState: PreloadedState;

    const renderSellForm = () => renderHookWithStoreProvider(() => useSellForm());

    const renderSellProviderPicker = () =>
        renderWithStoreProvider(<SellProviderPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

        const { result } = renderSellForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quotes are loaded', () => {
        const { toJSON } = renderSellProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', () => {
        preloadedState!.wallet!.trading!.sell!.isLoading = true;

        const { getByLabelText } = renderSellProviderPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        beforeEach(() => {
            preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;
            act(() => {
                form.setValue('quote', banxaCreditCardSellQuote);
            });
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;

            const { getByLabelText } = renderSellProviderPicker();

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should render selected payment provider', () => {
            const { getByLabelText } = renderSellProviderPicker();

            expect(getByLabelText('Selected provider')).toHaveTextContent('Banxa');
        });

        it('should display kyc warning when not loading', () => {
            const { getByText } = renderSellProviderPicker();

            expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
        });

        it('should not display kyc warning when loading', () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;
            const { queryByText } = renderSellProviderPicker();

            expect(
                queryByText('This provider requires to know your identity.'),
            ).not.toBeOnTheScreen();
        });

        it('should allow to select provider', () => {
            const { getByText, getByLabelText } = renderSellProviderPicker();

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('MoonPay'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('MoonPay');
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', () => {
                const { getByText } = renderSellProviderPicker();

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('MoonPay'));

                expect(reportMock).toHaveBeenCalledTimes(2);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'sell',
                        parameter: 'provider',
                    },
                });
            });

            it('should not fire analytics event when same provider is selected', () => {
                const { getAllByText } = renderSellProviderPicker();

                fireEvent.press(getAllByText('Banxa')[0]);
                fireEvent.press(getAllByText('Banxa')[1]);

                expect(reportMock).toHaveBeenCalledTimes(1);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', () => {
                preloadedState!.wallet!.trading!.sell!.isLoading = true;
                const { getByText } = renderSellProviderPicker();

                fireEvent.press(getByText('Provider'));

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
