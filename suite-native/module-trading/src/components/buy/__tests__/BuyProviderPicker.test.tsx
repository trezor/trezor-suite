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
} from '@suite-native/test-utils';
import {
    buyCexdirect,
    buyInvity,
    buyMercuryo,
    buyQuotes,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyProviderPicker } from '../BuyProviderPicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('BuyProviderPicker', () => {
    let form: BuyFormType;

    const renderUseTradingBuyForm = (preloadedState: PreloadedState = {}) => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });
        form = result.current;

        return form;
    };

    const renderTradingProviderPicker = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProvider(
            <Form form={form}>
                <BuyProviderPicker />
            </Form>,
            { preloadedState },
        );

    afterEach(() => {
        screen.unmount();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    it('should display nothing when in default state', () => {
        renderUseTradingBuyForm();
        const { toJSON } = renderTradingProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader while quotes are fetched', () => {
        const preloadedState: PreloadedState = {
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        };
        renderUseTradingBuyForm();
        const { getByLabelText } = renderTradingProviderPicker(preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        let preloadedState: PreloadedState;

        beforeEach(() => {
            act(() => {
                form.setValue('quote', buyQuotes[1]);
            });

            preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
            preloadedState.wallet!.trading!.buy!.buyInfo!.providerInfos = {
                invity: buyInvity,
                mercuryo: buyMercuryo,
                cexdirect: buyCexdirect,
            };
        });

        it('should allow to select provider', () => {
            const { getByText, getByLabelText } = renderTradingProviderPicker(preloadedState);

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('Mercuryo'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('Mercuryo');
        });

        it('should display loader while quotes are re-fetched', () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { getByLabelText } = renderTradingProviderPicker(preloadedState);

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { getByText } = renderTradingProviderPicker(preloadedState);

            fireEvent.press(getByText('Provider'));

            expect(getByText('Mercuryo')).toBeOnTheScreen();
        });

        it('should display kyc warning when not loading', () => {
            const { getByText } = renderTradingProviderPicker(preloadedState);

            expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
        });

        it('should not display kyc warning when loading', () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { queryByText } = renderTradingProviderPicker(preloadedState);
            expect(
                queryByText('This provider requires to know your identity.'),
            ).not.toBeOnTheScreen();
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', () => {
                const { getByText } = renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('Mercuryo'));

                expect(reportMock).toHaveBeenCalledTimes(2);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'buy',
                    },
                });
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'buy',
                        parameter: 'provider',
                    },
                });
            });

            it('should fire analytics event on provider change', () => {
                const { getByText } = renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('Mercuryo'));

                expect(reportMock).toHaveBeenCalledTimes(2);
            });

            it('should not fire analytics event when same provider is selected', () => {
                const { getByText, getAllByText } = renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getAllByText('Cexdirect')[1]);

                expect(reportMock).toHaveBeenCalledTimes(1);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'buy',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', () => {
                preloadedState!.wallet!.trading!.buy!.isLoading = true;
                const { getByText } = renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
