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
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';
import { SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellProviderPicker } from '../SellProviderPicker';

describe('SellProviderPicker', () => {
    let form: SellFormType;
    let preloadedState: PreloadedState;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellProviderPicker = () =>
        renderWithStoreProviderAsync(<SellProviderPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

        const { result } = await renderSellForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quotes are loaded', async () => {
        const { toJSON } = await renderSellProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.trading!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellProviderPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        beforeEach(() => {
            preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;
            act(() => {
                form.setValue('quote', sellQuotes[0]);
            });
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', async () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;

            const { getByLabelText } = await renderSellProviderPicker();

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should render selected payment provider', async () => {
            const { getByLabelText } = await renderSellProviderPicker();

            expect(getByLabelText('Selected provider')).toHaveTextContent('Banxa');
        });

        it('should display kyc warning when not loading', async () => {
            const { getByText } = await renderSellProviderPicker();

            expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
        });

        it('should not display kyc warning when loading', async () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;
            const { queryByText } = await renderSellProviderPicker();

            expect(
                queryByText('This provider requires to know your identity.'),
            ).not.toBeOnTheScreen();
        });

        it('should allow to select provider', async () => {
            const { getByText, getByLabelText } = await renderSellProviderPicker();

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('MoonPay'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('MoonPay');
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
                const { getByText } = await renderSellProviderPicker();

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('MoonPay'));

                expect(analyticsSpy).toHaveBeenCalledTimes(2);
                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingCompareOffers,
                    payload: {
                        type: 'sell',
                    },
                });
                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingParameterChanged,
                    payload: {
                        type: 'sell',
                        parameter: 'provider',
                    },
                });
            });

            it('should not fire analytics event when same provider is selected', async () => {
                const { getAllByText } = await renderSellProviderPicker();

                fireEvent.press(getAllByText('Banxa')[0]); // Open the picker
                fireEvent.press(getAllByText('Banxa')[1]); // Select the same provider

                expect(analyticsSpy).toHaveBeenCalledTimes(1);
                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingCompareOffers,
                    payload: {
                        type: 'sell',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', async () => {
                preloadedState!.wallet!.trading!.sell!.isLoading = true;
                const { getByText } = await renderSellProviderPicker();

                fireEvent.press(getByText('Provider'));

                expect(analyticsSpy).not.toHaveBeenCalled();
            });
        });
    });
});
