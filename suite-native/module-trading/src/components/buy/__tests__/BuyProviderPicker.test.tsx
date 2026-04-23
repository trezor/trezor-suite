import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, fireEvent, screen } from '@suite-native/test-utils-store';
import {
    buyCexdirect,
    buyInvity,
    buyMercuryo,
    cexdirectCreditCardBuyQuote,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { mergeDeepObject } from '@trezor/utils';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyProviderPicker } from '../BuyProviderPicker';

const reportMock = jest.fn();

describe('BuyProviderPicker', () => {
    let form: BuyFormType;

    const renderTradingProviderPicker = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <Form form={form}>
                <BuyProviderPicker />
            </Form>,
            {
                overrides,
                providers: ['intl', 'services', 'bottomSheet', 'navigation', 'formatter'],
            },
        );

    afterEach(() => {
        screen.unmount();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const { result } = renderHookWithTradingProvider(() => useBuyForm(), {
            providers: ['intl', 'navigation', 'formatter'],
        });
        form = result.current;
    });

    it('should display nothing when in default state', () => {
        const { toJSON } = renderTradingProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader while quotes are fetched', () => {
        const { getByLabelText } = renderTradingProviderPicker({
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        });

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        const initializedTrading = getInitializedTradingStateWithQuotes();
        const withQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: {
                trading: {
                    ...initializedTrading,
                    buy: {
                        ...initializedTrading.buy,
                        buyInfo: {
                            ...initializedTrading.buy.buyInfo,
                            providerInfos: {
                                invity: buyInvity,
                                mercuryo: buyMercuryo,
                                cexdirect: buyCexdirect,
                            },
                        },
                    },
                },
            },
        };

        beforeEach(() => {
            act(() => {
                form.setValue('quote', cexdirectCreditCardBuyQuote);
            });
        });

        it('should allow to select provider', () => {
            const { getByText, getByLabelText } = renderTradingProviderPicker(withQuotes);

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('Mercuryo'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('Mercuryo');
        });

        it('should display loader while quotes are re-fetched', () => {
            const { getByLabelText } = renderTradingProviderPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', () => {
            const { getByText } = renderTradingProviderPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );

            fireEvent.press(getByText('Provider'));

            expect(getByText('Mercuryo')).toBeOnTheScreen();
        });

        it('should display kyc warning when not loading', () => {
            const { getByText } = renderTradingProviderPicker(withQuotes);

            expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
        });

        it('should not display kyc warning when loading', () => {
            const { queryByText } = renderTradingProviderPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );
            expect(
                queryByText('This provider requires to know your identity.'),
            ).not.toBeOnTheScreen();
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', () => {
                const { getByText } = renderTradingProviderPicker(withQuotes);

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
                const { getByText } = renderTradingProviderPicker(withQuotes);

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('Mercuryo'));

                expect(reportMock).toHaveBeenCalledTimes(2);
            });

            it('should not fire analytics event when same provider is selected', () => {
                const { getByText, getAllByText } = renderTradingProviderPicker(withQuotes);

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
                const { getByText } = renderTradingProviderPicker(
                    mergeDeepObject(withQuotes, {
                        wallet: { trading: { buy: { isLoading: true } } },
                    }),
                );

                fireEvent.press(getByText('Provider'));

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
