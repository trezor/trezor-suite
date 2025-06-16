import { BuyTrade } from 'invity-api';

import { EventType, analytics } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { buyCexdirect, buyInvity, buyMercuryo } from '../../../__fixtures__/buyProviders';
import quotes from '../../../__fixtures__/quotes.json';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormType } from '../../../types/buy';
import { BuyProviderPicker } from '../BuyProviderPicker';

describe('BuyProviderPicker', () => {
    let form: BuyFormType;

    const renderUseTradingBuyForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm(), {
            preloadedState,
        });
        form = result.current;

        return form;
    };

    const renderTradingProviderPicker = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyProviderPicker />
            </Form>,
            { preloadedState },
        );

    it('should display nothing when in default state', async () => {
        await renderUseTradingBuyForm();
        const { toJSON } = await renderTradingProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader while quotes are fetched', async () => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: { buy: { isLoading: true, quotes: [] } } },
        };
        await renderUseTradingBuyForm();
        const { getByLabelText } = await renderTradingProviderPicker(preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        let preloadedState: PreloadedState;

        beforeEach(() => {
            act(() => {
                form.setValue('quote', quotes[1] as BuyTrade);
            });

            preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
            preloadedState.wallet!.tradingNew!.buy!.buyInfo!.providerInfos = {
                invity: buyInvity,
                mercuryo: buyMercuryo,
                cexdirect: buyCexdirect,
            };
        });

        it('should allow to select provider', async () => {
            const { getByText, getByLabelText } = await renderTradingProviderPicker(preloadedState);

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('Mercuryo'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('Mercuryo');
        });

        it('should display loader while quotes are re-fetched', async () => {
            preloadedState!.wallet!.tradingNew!.buy!.isLoading = true;
            const { getByLabelText } = await renderTradingProviderPicker(preloadedState);

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', async () => {
            preloadedState!.wallet!.tradingNew!.buy!.isLoading = true;
            const { getByText } = await renderTradingProviderPicker(preloadedState);

            fireEvent.press(getByText('Provider'));

            expect(getByText('Mercuryo')).toBeOnTheScreen();
        });

        describe('analytics', () => {
            const analyticsSpy = jest.spyOn(analytics, 'report');

            beforeEach(() => {
                analyticsSpy.mockClear();
            });

            afterAll(() => {
                analyticsSpy.mockRestore();
            });

            it('should fire analytics event on provider select', async () => {
                const { getByText } = await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('Mercuryo'));

                expect(analyticsSpy).toHaveBeenCalledTimes(2);
                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingCompareOffers,
                    payload: {
                        type: 'buy',
                    },
                });
                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingParameterChanged,
                    payload: {
                        type: 'buy',
                        parameter: 'provider',
                    },
                });
            });

            it('should fire analytics event on provider change', async () => {
                const { getByText } = await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('Mercuryo'));

                expect(analyticsSpy).toHaveBeenCalledTimes(2);
            });

            it('should not fire analytics event when same provider is selected', async () => {
                const { getByText, getAllByText } =
                    await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                // 1st Credit Card is the selected one, 2nd is the one in the list
                fireEvent.press(getAllByText('Cexdirect')[1]);

                expect(analyticsSpy).toHaveBeenCalledTimes(1);
                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingCompareOffers,
                    payload: {
                        type: 'buy',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', async () => {
                preloadedState!.wallet!.tradingNew!.buy!.isLoading = true;
                const { getByText } = await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));

                expect(analyticsSpy).not.toHaveBeenCalled();
            });
        });
    });
});
