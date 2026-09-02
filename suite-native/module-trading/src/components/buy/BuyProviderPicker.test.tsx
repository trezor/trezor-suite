import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, screen } from '@suite-native/test-utils-store';
import {
    buyCexdirect,
    buyInvity,
    buyMercuryo,
    cexdirectCreditCardBuyQuote,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { getIndexOrThrow, mergeDeepObject } from '@trezor/utils';

import { BuyProviderPicker } from './BuyProviderPicker';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('BuyProviderPicker', () => {
    let form: BuyFormType;

    const renderTradingProviderPicker = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <Form form={form}>
                <BuyProviderPicker />
            </Form>,
            { overrides, services },
        );

    afterEach(async () => {
        await screen.unmount();
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        const { result } = await renderHookWithTradingProvider(() => useBuyForm(), { services });
        form = result.current;
    });

    it('should display nothing when in default state', async () => {
        const { toJSON } = await renderTradingProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader while quotes are fetched', async () => {
        const { getByLabelText } = await renderTradingProviderPicker({
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        });

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeOnTheScreen();
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

        beforeEach(async () => {
            await act(() => {
                form.setValue('quote', cexdirectCreditCardBuyQuote);
            });
        });

        it('should allow to select provider', async () => {
            const { getByText, getByLabelText } = await renderTradingProviderPicker(withQuotes);

            await fireEvent.press(
                getByText(getTranslation('moduleTrading.tradingScreen.provider')),
            );
            await fireEvent.press(getByText('Mercuryo'));

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedProvider')),
            ).toHaveTextContent('Mercuryo');
        });

        it('should display loader while quotes are re-fetched', async () => {
            const { getByLabelText } = await renderTradingProviderPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
            ).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', async () => {
            const { getByText } = await renderTradingProviderPicker(
                mergeDeepObject(withQuotes, {
                    wallet: { trading: { buy: { isLoading: true } } },
                }),
            );

            await fireEvent.press(
                getByText(getTranslation('moduleTrading.tradingScreen.provider')),
            );

            expect(getByText('Mercuryo')).toBeOnTheScreen();
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', async () => {
                const { getByText } = await renderTradingProviderPicker(withQuotes);

                await fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                );
                await fireEvent.press(getByText('Mercuryo'));

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
                const { getByText } = await renderTradingProviderPicker(withQuotes);

                await fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                );
                await fireEvent.press(getByText('Mercuryo'));

                expect(reportMock).toHaveBeenCalledTimes(2);
            });

            it('should not fire analytics event when same provider is selected', async () => {
                const { getByText, getAllByText } = await renderTradingProviderPicker(withQuotes);

                await fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                );
                await fireEvent.press(getIndexOrThrow(getAllByText('Cexdirect'), 1));

                expect(reportMock).toHaveBeenCalledTimes(1);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'buy',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', async () => {
                const { getByText } = await renderTradingProviderPicker(
                    mergeDeepObject(withQuotes, {
                        wallet: { trading: { buy: { isLoading: true } } },
                    }),
                );

                await fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                );

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
