import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, fireEvent, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
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

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
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
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', async () => {
                const { getByText } = await renderTradingProviderPicker(preloadedState);

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

            it('should fire analytics event on provider change', async () => {
                const { getByText } = await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('Mercuryo'));

                expect(reportMock).toHaveBeenCalledTimes(2);
            });

            it('should not fire analytics event when same provider is selected', async () => {
                const { getByText, getAllByText } =
                    await renderTradingProviderPicker(preloadedState);

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

            it('should not call analytics when user tries to open sheet while quotes are loading', async () => {
                preloadedState!.wallet!.trading!.buy!.isLoading = true;
                const { getByText } = await renderTradingProviderPicker(preloadedState);

                fireEvent.press(getByText('Provider'));

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
