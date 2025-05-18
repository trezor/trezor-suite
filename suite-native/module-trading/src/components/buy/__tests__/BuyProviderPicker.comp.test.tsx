import { BuyTrade } from 'invity-api';

import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import quotes from '../../../__fixtures__/quotes.json';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import { BuyProviderPicker } from '../BuyProviderPicker';

describe('TradingProviderPicker', () => {
    const renderUseTradingBuyForm = (preloadedState: PreloadedState = {}) =>
        renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            preloadedState,
        });

    const renderTradingProviderPicker = (
        form: TradingBuyForm,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyProviderPicker />
            </Form>,
            { preloadedState },
        );

    it('should display nothing when in default state', async () => {
        const { result } = await renderUseTradingBuyForm();
        const { toJSON } = await renderTradingProviderPicker(result.current);
        expect(toJSON()).toBeNull();
    });

    it('should display selected provider according to quotes', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        const { result } = await renderUseTradingBuyForm(preloadedState);
        act(() => {
            result.current.setValue('quote', quotes[2] as BuyTrade);
        });

        const { getByLabelText } = await renderTradingProviderPicker(
            result.current,
            preloadedState,
        );

        expect(getByLabelText('Selected provider')).toHaveTextContent('Invity Finance');
    });

    it('should display loader while quotes are fetched', async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        preloadedState!.wallet!.tradingNew!.buy!.isLoading = true;
        const { result } = await renderUseTradingBuyForm(preloadedState);
        act(() => {
            result.current.setValue('quote', quotes[2] as BuyTrade);
        });
        const { getByLabelText } = await renderTradingProviderPicker(
            result.current,
            preloadedState,
        );

        expect(getByLabelText('Fetching offers...')).toBeTruthy();
    });
});
