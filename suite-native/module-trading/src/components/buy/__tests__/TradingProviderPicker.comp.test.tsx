import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { TradingProviderPicker } from '../TradingProviderPicker';

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
                <TradingProviderPicker />
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
            result.current.setValue('provider', 'invity');
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
            result.current.setValue('provider', 'invity');
        });
        const { getByLabelText } = await renderTradingProviderPicker(
            result.current,
            preloadedState,
        );

        expect(getByLabelText('Fetching offers...')).toBeDefined();
    });
});
