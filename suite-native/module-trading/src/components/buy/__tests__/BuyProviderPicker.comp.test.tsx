import { EventType, analytics } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    screen,
} from '@suite-native/test-utils';
import {
    buyCexdirect,
    buyInvity,
    buyMercuryo,
    buyQuotes,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
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

    afterEach(() => {
        screen.unmount();
    });

    it('should display nothing when in default state', async () => {
        await renderUseTradingBuyForm();
        const { toJSON } = await renderTradingProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader while quotes are fetched', async () => {
        const preloadedState: PreloadedState = {
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        };
        await renderUseTradingBuyForm();
        const { getByLabelText } = await renderTradingProviderPicker(preloadedState);

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

        it('should allow to select provider', async () => {
            const { getByText, getByLabelText } = await renderTradingProviderPicker(preloadedState);

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('Mercuryo'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('Mercuryo');
        });

        it('should display loader while quotes are re-fetched', async () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { getByLabelText } = await renderTradingProviderPicker(preloadedState);

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', async () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { getByText } = await renderTradingProviderPicker(preloadedState);

            fireEvent.press(getByText('Provider'));

            expect(getByText('Mercuryo')).toBeOnTheScreen();
        });

        it('should display kyc warning when not loading', async () => {
            const { getByText } = await renderTradingProviderPicker(preloadedState);

            expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
        });

        it('should not display kyc warning when loading', async () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { queryByText } = await renderTradingProviderPicker(preloadedState);
            expect(
                queryByText('This provider requires to know your identity.'),
            ).not.toBeOnTheScreen();
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
                preloadedState!.wallet!.trading!.buy!.isLoading = true;
                const { getByText } = await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));

                expect(analyticsSpy).not.toHaveBeenCalled();
            });
        });
    });
});
