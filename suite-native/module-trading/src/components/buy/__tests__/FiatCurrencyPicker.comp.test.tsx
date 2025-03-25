import {
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { FiatCurrencyPicker } from '../FiatCurrencyPicker';

describe('FiatCurrencyPicker', () => {
    const renderFiatCurrencyPicker = async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            preloadedState,
        });

        return renderWithStoreProviderAsync(<FiatCurrencyPicker form={result.current} />, {
            preloadedState,
        });
    };

    it('should display selected currency', async () => {
        const { getByLabelText } = await renderFiatCurrencyPicker();

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
    });

    it('should allow to select currency', async () => {
        const { getByText, getByLabelText } = await renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText('Select fiat currency'));
        fireEvent.press(getByText('USD'));

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/USD/);
    });
});
